using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Application.Services;

public class ShiftService : IShiftService
{
    private readonly IShiftRepository _shiftRepository;

    public ShiftService(IShiftRepository shiftRepository)
    {
        _shiftRepository = shiftRepository;
    }

    public async Task<ShiftSummaryDto?> GetActiveShiftAsync(int cashierId)
    {
        var shift = await _shiftRepository.GetActiveShiftByCashierIdAsync(cashierId);
        if (shift is null) return null;

        return await BuildSummaryAsync(shift);
    }

    public async Task<(ShiftSummaryDto? Result, string? Error)> OpenShiftAsync(int cashierId, OpenShiftDto dto)
    {
        var existing = await _shiftRepository.GetActiveShiftByCashierIdAsync(cashierId);
        if (existing is not null)
        {
            return (null, "You already have an active open shift. Please close it before opening a new one.");
        }

        if (dto.StartingCash < 0)
        {
            return (null, "Starting cash float cannot be negative.");
        }

        var shift = new Shift
        {
            CashierId = cashierId,
            StartTime = DateTime.UtcNow,
            Status = ShiftStatus.Open,
            StartingCash = dto.StartingCash,
            Notes = dto.Notes
        };

        await _shiftRepository.CreateAsync(shift);
        var createdWithDetails = await _shiftRepository.GetByIdWithDetailsAsync(shift.Id);

        return (await BuildSummaryAsync(createdWithDetails!), null);
    }

    public async Task<(ShiftSummaryDto? Result, string? Error)> CloseShiftAsync(int shiftId, int cashierId, CloseShiftDto dto)
    {
        var shift = await _shiftRepository.GetByIdWithDetailsAsync(shiftId);
        if (shift is null)
        {
            return (null, "Shift not found.");
        }

        if (shift.Status == ShiftStatus.Closed)
        {
            return (null, "This shift has already been closed.");
        }

        if (dto.CountedCash < 0)
        {
            return (null, "Counted cash cannot be negative.");
        }

        var summaryBeforeClose = await BuildSummaryAsync(shift);

        shift.EndTime = DateTime.UtcNow;
        shift.Status = ShiftStatus.Closed;
        shift.EndingCash = dto.CountedCash;
        shift.ExpectedCash = summaryBeforeClose.ExpectedCash;
        shift.CashDifference = dto.CountedCash - summaryBeforeClose.ExpectedCash;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            shift.Notes = string.IsNullOrWhiteSpace(shift.Notes)
                ? dto.Notes
                : $"{shift.Notes} | Close Note: {dto.Notes}";
        }

        await _shiftRepository.UpdateAsync(shift);

        var finalShift = await _shiftRepository.GetByIdWithDetailsAsync(shiftId);
        return (await BuildSummaryAsync(finalShift!), null);
    }

    public async Task<(CashMovementDto? Result, string? Error)> AddCashMovementAsync(int shiftId, int userId, CashMovementRequestDto dto)
    {
        var shift = await _shiftRepository.GetByIdWithDetailsAsync(shiftId);
        if (shift is null)
        {
            return (null, "Shift not found.");
        }

        if (shift.Status == ShiftStatus.Closed)
        {
            return (null, "Cannot add cash movement to a closed shift.");
        }

        if (dto.Amount <= 0)
        {
            return (null, "Amount must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return (null, "A reason for cash movement is required.");
        }

        if (!Enum.TryParse<CashMovementType>(dto.Type, true, out var movementType))
        {
            return (null, "Invalid movement type. Must be 'CashIn' or 'CashOut'.");
        }

        var movement = new CashMovement
        {
            ShiftId = shiftId,
            Type = movementType,
            Amount = dto.Amount,
            Reason = dto.Reason.Trim(),
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        var saved = await _shiftRepository.AddCashMovementAsync(movement);

        return (new CashMovementDto
        {
            Id = saved.Id,
            Type = saved.Type.ToString(),
            Amount = saved.Amount,
            Reason = saved.Reason,
            UserId = saved.UserId,
            UserName = shift.Cashier?.FullName ?? string.Empty,
            CreatedAt = saved.CreatedAt
        }, null);
    }

    public async Task<ShiftSummaryDto?> GetShiftSummaryAsync(int shiftId)
    {
        var shift = await _shiftRepository.GetByIdWithDetailsAsync(shiftId);
        if (shift is null) return null;

        return await BuildSummaryAsync(shift);
    }

    public async Task<List<ShiftSummaryDto>> GetAllShiftsAsync(DateTime? from = null, DateTime? to = null)
    {
        var shifts = await _shiftRepository.GetAllAsync(from, to);
        var list = new List<ShiftSummaryDto>();
        foreach (var shift in shifts)
        {
            list.Add(await BuildSummaryAsync(shift));
        }
        return list;
    }

    private async Task<ShiftSummaryDto> BuildSummaryAsync(Shift shift)
    {
        var endTime = shift.EndTime ?? DateTime.UtcNow;
        var sales = await _shiftRepository.GetSalesInShiftAsync(shift.StartTime, endTime, shift.CashierId);
        var returns = await _shiftRepository.GetReturnsInShiftAsync(shift.StartTime, endTime, shift.CashierId);

        decimal cashSales = 0;
        decimal cardSales = 0;
        decimal bankSales = 0;
        decimal totalSales = 0;

        foreach (var sale in sales)
        {
            totalSales += sale.GrandTotal;

            if (sale.Payments.Count > 0)
            {
                foreach (var p in sale.Payments)
                {
                    if (p.Method == PaymentMethod.Cash)
                    {
                        // Net cash from transaction = amount paid minus change returned
                        cashSales += (p.AmountPaid - p.Change);
                    }
                    else if (p.Method == PaymentMethod.Card)
                    {
                        cardSales += p.AmountPaid;
                    }
                    else if (p.Method == PaymentMethod.BankTransfer)
                    {
                        bankSales += p.AmountPaid;
                    }
                }
            }
        }

        decimal cashIn = 0;
        decimal cashOut = 0;
        var movementsDto = new List<CashMovementDto>();

        foreach (var m in shift.CashMovements)
        {
            if (m.Type == CashMovementType.CashIn)
                cashIn += m.Amount;
            else if (m.Type == CashMovementType.CashOut)
                cashOut += m.Amount;

            movementsDto.Add(new CashMovementDto
            {
                Id = m.Id,
                Type = m.Type.ToString(),
                Amount = m.Amount,
                Reason = m.Reason,
                UserId = m.UserId,
                UserName = m.User?.FullName ?? shift.Cashier?.FullName ?? "Unknown",
                CreatedAt = m.CreatedAt
            });
        }

        decimal totalRefunds = returns.Sum(r => r.TotalRefund);

        // Expected cash in drawer: StartingFloat + NetCashSales + CashIn - CashOut - Refunds
        decimal expectedCash = shift.StartingCash + cashSales + cashIn - cashOut - totalRefunds;
        decimal? variance = shift.EndingCash.HasValue
            ? shift.EndingCash.Value - expectedCash
            : null;

        return new ShiftSummaryDto
        {
            ShiftId = shift.Id,
            CashierId = shift.CashierId,
            CashierName = shift.Cashier?.FullName ?? "Cashier",
            StartTime = shift.StartTime,
            EndTime = shift.EndTime,
            Status = shift.Status.ToString(),
            StartingCash = shift.StartingCash,
            CashSales = cashSales,
            CardSales = cardSales,
            BankSales = bankSales,
            TotalSales = totalSales,
            TotalTransactions = sales.Count,
            CashIn = cashIn,
            CashOut = cashOut,
            TotalRefunds = totalRefunds,
            TotalRefundTransactions = returns.Count,
            ExpectedCash = expectedCash,
            CountedCash = shift.EndingCash,
            Variance = variance,
            Notes = shift.Notes,
            CashMovements = movementsDto.OrderByDescending(cm => cm.CreatedAt).ToList()
        };
    }
}

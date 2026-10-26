using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IShiftService
{
    Task<ShiftSummaryDto?> GetActiveShiftAsync(int cashierId);
    Task<(ShiftSummaryDto? Result, string? Error)> OpenShiftAsync(int cashierId, OpenShiftDto dto);
    Task<(ShiftSummaryDto? Result, string? Error)> CloseShiftAsync(int shiftId, int cashierId, CloseShiftDto dto);
    Task<(CashMovementDto? Result, string? Error)> AddCashMovementAsync(int shiftId, int userId, CashMovementRequestDto dto);
    Task<ShiftSummaryDto?> GetShiftSummaryAsync(int shiftId);
    Task<List<ShiftSummaryDto>> GetAllShiftsAsync(DateTime? from = null, DateTime? to = null);
}

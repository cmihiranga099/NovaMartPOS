using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class ShiftRepository : IShiftRepository
{
    private readonly AppDbContext _context;

    public ShiftRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Shift?> GetActiveShiftByCashierIdAsync(int cashierId)
    {
        return await _context.Shifts
            .Include(s => s.Cashier)
            .Include(s => s.CashMovements)
                .ThenInclude(cm => cm.User)
            .FirstOrDefaultAsync(s => s.CashierId == cashierId && s.Status == ShiftStatus.Open);
    }

    public async Task<Shift?> GetByIdWithDetailsAsync(int shiftId)
    {
        return await _context.Shifts
            .Include(s => s.Cashier)
            .Include(s => s.CashMovements)
                .ThenInclude(cm => cm.User)
            .FirstOrDefaultAsync(s => s.Id == shiftId);
    }

    public async Task<List<Shift>> GetAllAsync(DateTime? from = null, DateTime? to = null)
    {
        var query = _context.Shifts
            .Include(s => s.Cashier)
            .Include(s => s.CashMovements)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(s => s.StartTime >= from.Value);

        if (to.HasValue)
            query = query.Where(s => s.StartTime <= to.Value);

        return await query.OrderByDescending(s => s.StartTime).ToListAsync();
    }

    public async Task<Shift> CreateAsync(Shift shift)
    {
        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();
        return shift;
    }

    public async Task UpdateAsync(Shift shift)
    {
        _context.Shifts.Update(shift);
        await _context.SaveChangesAsync();
    }

    public async Task<CashMovement> AddCashMovementAsync(CashMovement movement)
    {
        _context.CashMovements.Add(movement);
        await _context.SaveChangesAsync();
        return movement;
    }

    public async Task<List<Sale>> GetSalesInShiftAsync(DateTime startTime, DateTime? endTime, int? cashierId = null)
    {
        var query = _context.Sales
            .Include(s => s.Payments)
            .Include(s => s.SaleItems)
            .Where(s => s.CreatedAt >= startTime);

        if (endTime.HasValue)
            query = query.Where(s => s.CreatedAt <= endTime.Value);

        if (cashierId.HasValue)
            query = query.Where(s => s.CashierId == cashierId.Value);

        return await query.ToListAsync();
    }

    public async Task<List<Return>> GetReturnsInShiftAsync(DateTime startTime, DateTime? endTime, int? cashierId = null)
    {
        var query = _context.Returns
            .Include(r => r.Sale)
            .Where(r => r.CreatedAt >= startTime);

        if (endTime.HasValue)
            query = query.Where(r => r.CreatedAt <= endTime.Value);

        if (cashierId.HasValue)
            query = query.Where(r => r.Sale.CashierId == cashierId.Value);

        return await query.ToListAsync();
    }
}

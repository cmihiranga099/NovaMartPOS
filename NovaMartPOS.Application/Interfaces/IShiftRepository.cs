using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IShiftRepository
{
    Task<Shift?> GetActiveShiftByCashierIdAsync(int cashierId);
    Task<Shift?> GetByIdWithDetailsAsync(int shiftId);
    Task<List<Shift>> GetAllAsync(DateTime? from = null, DateTime? to = null);
    Task<Shift> CreateAsync(Shift shift);
    Task UpdateAsync(Shift shift);
    Task<CashMovement> AddCashMovementAsync(CashMovement movement);
    Task<List<Sale>> GetSalesInShiftAsync(DateTime startTime, DateTime? endTime, int? cashierId = null);
    Task<List<Return>> GetReturnsInShiftAsync(DateTime startTime, DateTime? endTime, int? cashierId = null);
}

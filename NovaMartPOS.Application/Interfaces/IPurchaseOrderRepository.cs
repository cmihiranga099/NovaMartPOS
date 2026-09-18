using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IPurchaseOrderRepository
{
    Task<string> GeneratePoNumberAsync();
    Task CreateAsync(PurchaseOrder purchaseOrder, List<StockTransaction> stockTransactions);
    Task<PurchaseOrder?> GetByIdWithDetailsAsync(int id);
    Task<List<PurchaseOrder>> GetAllWithDetailsAsync();
}
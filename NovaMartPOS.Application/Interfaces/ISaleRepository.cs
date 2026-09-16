using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface ISaleRepository
{
    Task<string> GenerateInvoiceNumberAsync();
    Task CreateSaleAsync(Sale sale, List<StockTransaction> stockTransactions);
    Task<Sale?> GetByIdWithDetailsAsync(int id);
}
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IReturnRepository
{
    Task<Sale?> GetSaleWithItemsAsync(int saleId);
    Task<int> GetAlreadyReturnedQuantityAsync(int saleItemId);
    Task CreateReturnAsync(Return returnRecord, List<StockTransaction> stockTransactions, List<Product> productsToUpdate);
}
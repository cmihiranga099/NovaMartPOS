using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IInventoryRepository
{
    Task<List<StockTransaction>> GetHistoryAsync(int? productId = null);
    Task<List<Product>> GetLowStockProductsAsync();
    Task AdjustStockAsync(Product product, StockTransaction transaction);
}
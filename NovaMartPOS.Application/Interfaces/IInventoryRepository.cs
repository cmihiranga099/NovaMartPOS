using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IInventoryRepository
{
    Task<List<StockTransaction>> GetHistoryAsync(int? productId = null);
    Task<List<Product>> GetLowStockProductsAsync();
    Task<List<Product>> GetExpiringProductsAsync(int withinDays);
    Task AdjustStockAsync(Product product, StockTransaction transaction);
}
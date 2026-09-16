using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IInventoryService
{
    Task<(StockTransactionDto? Result, string? Error)> AdjustStockAsync(CreateStockAdjustmentDto dto);
    Task<List<StockTransactionDto>> GetHistoryAsync(int? productId = null);
    Task<List<ProductDto>> GetLowStockProductsAsync();
}
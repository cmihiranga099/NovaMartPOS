using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly IInventoryRepository _inventoryRepository;
    private readonly IProductRepository _productRepository;

    public InventoryService(IInventoryRepository inventoryRepository, IProductRepository productRepository)
    {
        _inventoryRepository = inventoryRepository;
        _productRepository = productRepository;
    }

    public async Task<(StockTransactionDto? Result, string? Error)> AdjustStockAsync(CreateStockAdjustmentDto dto)
    {
        if (!Enum.TryParse<StockTransactionType>(dto.Type, true, out var type) ||
            (type != StockTransactionType.AdjustmentIn && type != StockTransactionType.AdjustmentOut))
        {
            return (null, "Type must be 'AdjustmentIn' or 'AdjustmentOut'.");
        }

        if (dto.Quantity <= 0)
            return (null, "Quantity must be greater than zero.");

        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        if (product is null || !product.IsActive)
            return (null, "Product not found or inactive.");

        if (type == StockTransactionType.AdjustmentOut && product.StockQuantity < dto.Quantity)
            return (null, $"Cannot remove {dto.Quantity} units — only {product.StockQuantity} in stock.");

        product.StockQuantity += type == StockTransactionType.AdjustmentIn ? dto.Quantity : -dto.Quantity;
        product.UpdatedAt = DateTime.UtcNow;

        var transaction = new StockTransaction
        {
            ProductId = product.Id,
            Type = type,
            Quantity = dto.Quantity,
            Notes = dto.Notes
        };

        await _inventoryRepository.AdjustStockAsync(product, transaction);

        return (new StockTransactionDto
        {
            Id = transaction.Id,
            ProductId = product.Id,
            ProductName = product.Name,
            Type = type.ToString(),
            Quantity = dto.Quantity,
            Notes = dto.Notes,
            CreatedAt = transaction.CreatedAt
        }, null);
    }

    public async Task<List<StockTransactionDto>> GetHistoryAsync(int? productId = null)
    {
        var history = await _inventoryRepository.GetHistoryAsync(productId);
        return history.Select(t => new StockTransactionDto
        {
            Id = t.Id,
            ProductId = t.ProductId,
            ProductName = t.Product?.Name ?? string.Empty,
            Type = t.Type.ToString(),
            Quantity = t.Quantity,
            Notes = t.Notes,
            CreatedAt = t.CreatedAt
        }).ToList();
    }

    public async Task<List<ProductDto>> GetLowStockProductsAsync()
    {
        var products = await _inventoryRepository.GetLowStockProductsAsync();
        return products.Select(p => new ProductDto
        {
            Id = p.Id,
            ProductCode = p.ProductCode,
            Barcode = p.Barcode,
            Name = p.Name,
            PurchasePrice = p.PurchasePrice,
            SellingPrice = p.SellingPrice,
            TaxRate = p.TaxRate,
            StockQuantity = p.StockQuantity,
            MinimumStockLevel = p.MinimumStockLevel,
            IsActive = p.IsActive,
            CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name ?? string.Empty,
            BrandId = p.BrandId,
            BrandName = p.Brand?.Name ?? string.Empty,
            SupplierId = p.SupplierId
        }).ToList();
    }
}
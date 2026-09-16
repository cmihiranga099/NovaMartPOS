using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repository;

    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ProductDto>> GetAllAsync()
    {
        var products = await _repository.GetAllAsync();
        return products.Select(MapToDto).ToList();
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        return product is null ? null : MapToDto(product);
    }

    public async Task<ProductDto?> GetByBarcodeAsync(string barcode)
    {
        var product = await _repository.GetByBarcodeAsync(barcode);
        return product is null ? null : MapToDto(product);
    }

    public async Task<(ProductDto? Product, string? Error)> CreateAsync(CreateProductDto dto)
    {
        var validationError = await ValidateAsync(dto.Barcode, dto.ProductCode, dto.CategoryId, dto.BrandId,
            dto.PurchasePrice, dto.SellingPrice, dto.StockQuantity, excludeId: null);

        if (validationError is not null)
            return (null, validationError);

        var product = new Product
        {
            ProductCode = dto.ProductCode,
            Barcode = dto.Barcode,
            Name = dto.Name,
            PurchasePrice = dto.PurchasePrice,
            SellingPrice = dto.SellingPrice,
            TaxRate = dto.TaxRate,
            StockQuantity = dto.StockQuantity,
            MinimumStockLevel = dto.MinimumStockLevel,
            CategoryId = dto.CategoryId,
            BrandId = dto.BrandId,
            SupplierId = dto.SupplierId,
            IsActive = true
        };

        await _repository.AddAsync(product);

        var saved = await _repository.GetByIdAsync(product.Id);
        return (MapToDto(saved!), null);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await _repository.GetByIdAsync(id);
        if (product is null) return (false, "Product not found.");

        var validationError = await ValidateAsync(dto.Barcode, dto.ProductCode, dto.CategoryId, dto.BrandId,
            dto.PurchasePrice, dto.SellingPrice, dto.StockQuantity, excludeId: id);

        if (validationError is not null)
            return (false, validationError);

        product.ProductCode = dto.ProductCode;
        product.Barcode = dto.Barcode;
        product.Name = dto.Name;
        product.PurchasePrice = dto.PurchasePrice;
        product.SellingPrice = dto.SellingPrice;
        product.TaxRate = dto.TaxRate;
        product.StockQuantity = dto.StockQuantity;
        product.MinimumStockLevel = dto.MinimumStockLevel;
        product.IsActive = dto.IsActive;
        product.CategoryId = dto.CategoryId;
        product.BrandId = dto.BrandId;
        product.SupplierId = dto.SupplierId;
        product.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(product);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        if (product is null) return (false, "Product not found.");

        // Soft delete instead of hard delete — preserves sale history integrity
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(product);

        return (true, null);
    }

    private async Task<string?> ValidateAsync(
        string barcode, string productCode, int categoryId, int brandId,
        decimal purchasePrice, decimal sellingPrice, int stockQuantity, int? excludeId)
    {
        if (string.IsNullOrWhiteSpace(barcode))
            return "Barcode is required.";

        if (string.IsNullOrWhiteSpace(productCode))
            return "Product code is required.";

        if (purchasePrice < 0)
            return "Purchase price cannot be negative.";

        if (sellingPrice < 0)
            return "Selling price cannot be negative.";

        if (stockQuantity < 0)
            return "Stock quantity cannot be negative.";

        if (await _repository.BarcodeExistsAsync(barcode, excludeId))
            return "A product with this barcode already exists.";

        if (await _repository.ProductCodeExistsAsync(productCode, excludeId))
            return "A product with this product code already exists.";

        if (!await _repository.CategoryExistsAsync(categoryId))
            return "The specified category does not exist.";

        if (!await _repository.BrandExistsAsync(brandId))
            return "The specified brand does not exist.";

        return null;
    }

    private static ProductDto MapToDto(Product p) => new()
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
    };
}
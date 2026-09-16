using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product?> GetByBarcodeAsync(string barcode);
    Task<bool> BarcodeExistsAsync(string barcode, int? excludeId = null);
    Task<bool> ProductCodeExistsAsync(string productCode, int? excludeId = null);
    Task<bool> CategoryExistsAsync(int categoryId);
    Task<bool> BrandExistsAsync(int brandId);
    Task AddAsync(Product product);
    Task UpdateAsync(Product product);
    Task DeleteAsync(Product product);
}
using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IProductService
{
    Task<List<ProductDto>> GetAllAsync();
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto?> GetByBarcodeAsync(string barcode);
    Task<(ProductDto? Product, string? Error)> CreateAsync(CreateProductDto dto);
    Task<(bool Success, string? Error)> UpdateAsync(int id, UpdateProductDto dto);
    Task<(bool Success, string? Error)> DeleteAsync(int id);
}
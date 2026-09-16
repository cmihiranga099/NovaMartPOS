using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IBrandService
{
    Task<List<BrandDto>> GetAllAsync();
    Task<BrandDto?> GetByIdAsync(int id);
    Task<BrandDto> CreateAsync(CreateBrandDto dto);
    Task<bool> UpdateAsync(int id, UpdateBrandDto dto);
    Task<(bool Success, string? Error)> DeleteAsync(int id);
}
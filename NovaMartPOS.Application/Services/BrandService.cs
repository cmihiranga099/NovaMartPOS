using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Services;

public class BrandService : IBrandService
{
    private readonly IBrandRepository _repository;

    public BrandService(IBrandRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<BrandDto>> GetAllAsync()
    {
        var brands = await _repository.GetAllAsync();
        return brands.Select(MapToDto).ToList();
    }

    public async Task<BrandDto?> GetByIdAsync(int id)
    {
        var brand = await _repository.GetByIdAsync(id);
        return brand is null ? null : MapToDto(brand);
    }

    public async Task<BrandDto> CreateAsync(CreateBrandDto dto)
    {
        var brand = new Brand
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActive = true
        };

        await _repository.AddAsync(brand);
        return MapToDto(brand);
    }

    public async Task<bool> UpdateAsync(int id, UpdateBrandDto dto)
    {
        var brand = await _repository.GetByIdAsync(id);
        if (brand is null) return false;

        brand.Name = dto.Name;
        brand.Description = dto.Description;
        brand.IsActive = dto.IsActive;
        brand.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(brand);
        return true;
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var brand = await _repository.GetByIdAsync(id);
        if (brand is null) return (false, "Brand not found.");

        if (await _repository.HasProductsAsync(id))
            return (false, "Cannot delete a brand that has products assigned to it. Deactivate it instead.");

        await _repository.DeleteAsync(brand);
        return (true, null);
    }

    private static BrandDto MapToDto(Brand b) => new()
    {
        Id = b.Id,
        Name = b.Name,
        Description = b.Description,
        IsActive = b.IsActive
    };
}
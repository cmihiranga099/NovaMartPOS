using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _repository;

    public CategoryService(ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var categories = await _repository.GetAllAsync();
        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        return category is null ? null : MapToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActive = true
        };

        await _repository.AddAsync(category);
        return MapToDto(category);
    }

    public async Task<bool> UpdateAsync(int id, UpdateCategoryDto dto)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category is null) return false;

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.IsActive = dto.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(category);
        return true;
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category is null) return (false, "Category not found.");

        if (await _repository.HasProductsAsync(id))
            return (false, "Cannot delete a category that has products assigned to it. Deactivate it instead.");

        await _repository.DeleteAsync(category);
        return (true, null);
    }

    private static CategoryDto MapToDto(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        IsActive = c.IsActive
    };
}
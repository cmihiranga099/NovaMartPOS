using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Services;

public class SupplierService : ISupplierService
{
    private readonly ISupplierRepository _repository;

    public SupplierService(ISupplierRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<SupplierDto>> GetAllAsync()
    {
        var suppliers = await _repository.GetAllAsync();
        return suppliers.Select(MapToDto).ToList();
    }

    public async Task<SupplierDto?> GetByIdAsync(int id)
    {
        var supplier = await _repository.GetByIdAsync(id);
        return supplier is null ? null : MapToDto(supplier);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierDto dto)
    {
        var supplier = new Supplier
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            IsActive = true
        };

        await _repository.AddAsync(supplier);
        return MapToDto(supplier);
    }

    public async Task<bool> UpdateAsync(int id, UpdateSupplierDto dto)
    {
        var supplier = await _repository.GetByIdAsync(id);
        if (supplier is null) return false;

        supplier.Name = dto.Name;
        supplier.Phone = dto.Phone;
        supplier.Email = dto.Email;
        supplier.Address = dto.Address;
        supplier.IsActive = dto.IsActive;
        supplier.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(supplier);
        return true;
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var supplier = await _repository.GetByIdAsync(id);
        if (supplier is null) return (false, "Supplier not found.");

        if (await _repository.HasProductsAsync(id))
            return (false, "Cannot delete a supplier that has products assigned to it. Deactivate it instead.");

        await _repository.DeleteAsync(supplier);
        return (true, null);
    }

    private static SupplierDto MapToDto(Supplier s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Phone = s.Phone,
        Email = s.Email,
        Address = s.Address,
        IsActive = s.IsActive
    };
}
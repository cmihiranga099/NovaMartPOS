using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface ISupplierService
{
    Task<List<SupplierDto>> GetAllAsync();
    Task<SupplierDto?> GetByIdAsync(int id);
    Task<SupplierDto> CreateAsync(CreateSupplierDto dto);
    Task<bool> UpdateAsync(int id, UpdateSupplierDto dto);
    Task<(bool Success, string? Error)> DeleteAsync(int id);
}
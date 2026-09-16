using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IBrandRepository
{
    Task<List<Brand>> GetAllAsync();
    Task<Brand?> GetByIdAsync(int id);
    Task<bool> HasProductsAsync(int brandId);
    Task AddAsync(Brand brand);
    Task UpdateAsync(Brand brand);
    Task DeleteAsync(Brand brand);
}
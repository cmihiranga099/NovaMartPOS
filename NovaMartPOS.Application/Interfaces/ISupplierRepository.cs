using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface ISupplierRepository
{
    Task<List<Supplier>> GetAllAsync();
    Task<Supplier?> GetByIdAsync(int id);
    Task<bool> HasProductsAsync(int supplierId);
    Task AddAsync(Supplier supplier);
    Task UpdateAsync(Supplier supplier);
    Task DeleteAsync(Supplier supplier);
}
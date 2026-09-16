using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class BrandRepository : IBrandRepository
{
    private readonly AppDbContext _context;

    public BrandRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Brand>> GetAllAsync()
        => await _context.Brands.AsNoTracking().ToListAsync();

    public async Task<Brand?> GetByIdAsync(int id)
        => await _context.Brands.FindAsync(id);

    public async Task<bool> HasProductsAsync(int brandId)
        => await _context.Products.AnyAsync(p => p.BrandId == brandId);

    public async Task AddAsync(Brand brand)
    {
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Brand brand)
    {
        _context.Brands.Update(brand);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Brand brand)
    {
        _context.Brands.Remove(brand);
        await _context.SaveChangesAsync();
    }
}
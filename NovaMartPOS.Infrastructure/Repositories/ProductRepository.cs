using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;

    public ProductRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync()
        => await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .AsNoTracking()
            .ToListAsync();

    public async Task<Product?> GetByIdAsync(int id)
        => await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Product?> GetByBarcodeAsync(string barcode)
        => await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Barcode == barcode);

    public async Task<bool> BarcodeExistsAsync(string barcode, int? excludeId = null)
        => await _context.Products.AnyAsync(p => p.Barcode == barcode && p.Id != (excludeId ?? 0));

    public async Task<bool> ProductCodeExistsAsync(string productCode, int? excludeId = null)
        => await _context.Products.AnyAsync(p => p.ProductCode == productCode && p.Id != (excludeId ?? 0));

    public async Task<bool> CategoryExistsAsync(int categoryId)
        => await _context.Categories.AnyAsync(c => c.Id == categoryId);

    public async Task<bool> BrandExistsAsync(int brandId)
        => await _context.Brands.AnyAsync(b => b.Id == brandId);

    public async Task AddAsync(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Product product)
    {
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }
}
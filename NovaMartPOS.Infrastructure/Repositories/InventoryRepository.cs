using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class InventoryRepository : IInventoryRepository
{
    private readonly AppDbContext _context;

    public InventoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StockTransaction>> GetHistoryAsync(int? productId = null)
    {
        var query = _context.StockTransactions
            .Include(t => t.Product)
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(t => t.ProductId == productId.Value);

        return await query.ToListAsync();
    }

    public async Task<List<Product>> GetLowStockProductsAsync()
        => await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Where(p => p.IsActive && p.StockQuantity <= p.MinimumStockLevel)
            .AsNoTracking()
            .ToListAsync();

    public async Task<List<Product>> GetExpiringProductsAsync(int withinDays)
    {
        // Compute the cutoff in C# (not inside the LINQ-to-SQL expression) so EF can
        // translate the comparison to plain SQL rather than trying to call DateTime.Now
        // on the server.
        var cutoff = DateTime.UtcNow.Date.AddDays(withinDays);

        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            // Still-in-stock products whose expiry is within the window — this also
            // naturally includes anything already expired (ExpiryDate in the past),
            // since "the past" is always <= cutoff too.
            .Where(p => p.IsActive && p.ExpiryDate != null && p.ExpiryDate <= cutoff && p.StockQuantity > 0)
            .OrderBy(p => p.ExpiryDate)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task AdjustStockAsync(Product product, StockTransaction transaction)
    {
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Products.Update(product);
            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }
}
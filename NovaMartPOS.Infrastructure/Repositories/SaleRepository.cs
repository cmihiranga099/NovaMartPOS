using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class SaleRepository : ISaleRepository
{
    private readonly AppDbContext _context;

    public SaleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateInvoiceNumberAsync()
    {
        var count = await _context.Sales.CountAsync();
        var next = count + 1;
        return $"INV-{DateTime.UtcNow:yyyyMMdd}-{next:D5}";
    }

    public async Task CreateSaleAsync(Sale sale, List<StockTransaction> stockTransactions)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Sales.Add(sale);
            _context.StockTransactions.AddRange(stockTransactions);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<Sale>> GetAllWithDetailsAsync()
    => await _context.Sales
        .Include(s => s.Customer)
        .Include(s => s.Cashier)
        .Include(s => s.Payment)
        .Include(s => s.SaleItems)
            .ThenInclude(si => si.Product)
        .OrderByDescending(s => s.CreatedAt)
        .AsSplitQuery()
        .AsNoTracking()
        .ToListAsync();

    public async Task<Sale?> GetByIdWithDetailsAsync(int id)
        => await _context.Sales
            .Include(s => s.Customer)
            .Include(s => s.Cashier)
            .Include(s => s.Payment)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == id);
}
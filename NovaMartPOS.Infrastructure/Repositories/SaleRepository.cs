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
        var todayPrefix = $"INV-{DateTime.UtcNow:yyyyMMdd}-";
        var lastInvoiceToday = await _context.Sales
            .Where(s => s.InvoiceNumber.StartsWith(todayPrefix))
            .OrderByDescending(s => s.InvoiceNumber)
            .Select(s => s.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextSeq = 1;
        if (lastInvoiceToday is not null && lastInvoiceToday.Length >= todayPrefix.Length)
        {
            var rawSeq = lastInvoiceToday.Substring(todayPrefix.Length);
            var seqPart = rawSeq.Contains('-') ? rawSeq.Split('-')[0] : rawSeq;
            if (int.TryParse(seqPart, out var parsed))
                nextSeq = parsed + 1;
        }

        return $"{todayPrefix}{nextSeq:D5}";
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
        .Include(s => s.Payments)
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
            .Include(s => s.Payments)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == id);
}

using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class PurchaseOrderRepository : IPurchaseOrderRepository
{
    private readonly AppDbContext _context;

    public PurchaseOrderRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> GeneratePoNumberAsync()
    {
        var count = await _context.PurchaseOrders.CountAsync();
        var next = count + 1;
        return $"PO-{DateTime.UtcNow:yyyyMMdd}-{next:D5}";
    }

    public async Task CreateAsync(PurchaseOrder purchaseOrder, List<StockTransaction> stockTransactions)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.PurchaseOrders.Add(purchaseOrder);
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

    public async Task<List<PurchaseOrder>> GetAllWithDetailsAsync()
        => await _context.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.ReceivedBy)
            .Include(po => po.Items)
                .ThenInclude(i => i.Product)
            .OrderByDescending(po => po.CreatedAt)
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync();

    public async Task<PurchaseOrder?> GetByIdWithDetailsAsync(int id)
        => await _context.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.ReceivedBy)
            .Include(po => po.Items)
                .ThenInclude(i => i.Product)
            .AsSplitQuery()
            .FirstOrDefaultAsync(po => po.Id == id);
}
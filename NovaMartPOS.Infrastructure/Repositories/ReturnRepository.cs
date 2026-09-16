using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class ReturnRepository : IReturnRepository
{
    private readonly AppDbContext _context;

    public ReturnRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Sale?> GetSaleWithItemsAsync(int saleId)
        => await _context.Sales
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == saleId);

    public async Task<int> GetAlreadyReturnedQuantityAsync(int saleItemId)
        => await _context.ReturnItems
            .Where(ri => ri.SaleItemId == saleItemId)
            .SumAsync(ri => (int?)ri.Quantity) ?? 0;

    public async Task CreateReturnAsync(Return returnRecord, List<StockTransaction> stockTransactions, List<Product> productsToUpdate)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Returns.Add(returnRecord);
            _context.StockTransactions.AddRange(stockTransactions);
            _context.Products.UpdateRange(productsToUpdate);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class ReportRepository : IReportRepository
{
    private readonly AppDbContext _context;

    public ReportRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Sale>> GetSalesInRangeAsync(DateTime from, DateTime to)
        => await _context.Sales
            .Include(s => s.Cashier)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Product)
            .Where(s => s.CreatedAt >= from && s.CreatedAt < to)
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync();
}
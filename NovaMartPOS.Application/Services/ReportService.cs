using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.Application.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _repository;

    public ReportService(IReportRepository repository)
    {
        _repository = repository;
    }

    public async Task<DailySalesReportDto> GetDailySalesAsync(DateTime date)
    {
        var from = date.Date;
        var to = from.AddDays(1);
        var sales = await _repository.GetSalesInRangeAsync(from, to);

        decimal profit = sales
            .SelectMany(s => s.SaleItems)
            .Sum(si => (si.UnitPrice - si.Product.PurchasePrice) * si.Quantity - si.Discount);

        return new DailySalesReportDto
        {
            Date = from,
            TransactionCount = sales.Count,
            TotalSales = sales.Sum(s => s.GrandTotal),
            TotalDiscount = sales.Sum(s => s.Discount),
            TotalTax = sales.Sum(s => s.Tax),
            TotalProfit = profit
        };
    }

    public async Task<List<CashierSalesReportDto>> GetSalesByCashierAsync(DateTime from, DateTime to)
    {
        var sales = await _repository.GetSalesInRangeAsync(from, to);

        return sales
            .GroupBy(s => new { s.CashierId, s.Cashier.FullName })
            .Select(g => new CashierSalesReportDto
            {
                CashierId = g.Key.CashierId,
                CashierName = g.Key.FullName,
                TransactionCount = g.Count(),
                TotalSales = g.Sum(s => s.GrandTotal)
            })
            .OrderByDescending(c => c.TotalSales)
            .ToList();
    }

    public async Task<List<TopProductDto>> GetTopProductsAsync(DateTime from, DateTime to, int take = 10)
    {
        var sales = await _repository.GetSalesInRangeAsync(from, to);

        return sales
            .SelectMany(s => s.SaleItems)
            .GroupBy(si => new { si.ProductId, si.Product.Name })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                QuantitySold = g.Sum(si => si.Quantity),
                TotalRevenue = g.Sum(si => si.Total)
            })
            .OrderByDescending(p => p.QuantitySold)
            .Take(take)
            .ToList();
    }
}
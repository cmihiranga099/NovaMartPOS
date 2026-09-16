using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IReportService
{
    Task<DailySalesReportDto> GetDailySalesAsync(DateTime date);
    Task<List<CashierSalesReportDto>> GetSalesByCashierAsync(DateTime from, DateTime to);
    Task<List<TopProductDto>> GetTopProductsAsync(DateTime from, DateTime to, int take = 10);
}
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IReportRepository
{
    Task<List<Sale>> GetSalesInRangeAsync(DateTime from, DateTime to);
}
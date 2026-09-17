using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface ISaleService
{
    Task<(SaleDto? Sale, string? Error)> CheckoutAsync(CreateSaleDto dto, int cashierId);
    Task<SaleDto?> GetByIdAsync(int id);
    Task<List<SaleDto>> GetAllAsync();
}
using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IPurchaseOrderService
{
    Task<(PurchaseOrderDto? PurchaseOrder, string? Error)> ReceiveAsync(CreatePurchaseOrderDto dto, int receivedById);
    Task<PurchaseOrderDto?> GetByIdAsync(int id);
    Task<List<PurchaseOrderDto>> GetAllAsync();
}
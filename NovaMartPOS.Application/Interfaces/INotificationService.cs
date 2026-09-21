using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface INotificationService
{
    Task NotifySaleCompletedAsync(SaleDto sale);
}
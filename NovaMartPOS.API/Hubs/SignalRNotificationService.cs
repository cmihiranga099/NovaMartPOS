using Microsoft.AspNetCore.SignalR;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Hubs;

public class SignalRNotificationService : INotificationService
{
    private readonly IHubContext<DashboardHub> _hubContext;

    public SignalRNotificationService(IHubContext<DashboardHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifySaleCompletedAsync(SaleDto sale)
    {
        await _hubContext.Clients.All.SendAsync("SaleCompleted", sale);
    }
}
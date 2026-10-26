using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NovaMartPOS.API.Hubs;

[AllowAnonymous]
public class CustomerDisplayHub : Hub
{
    public async Task JoinRegister(string registerId)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveRegister(string registerId)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task BroadcastCartUpdate(string registerId, object cartState)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Clients.Group(groupName).SendAsync("CartUpdated", cartState);
    }

    public async Task BroadcastPaymentUpdate(string registerId, object paymentState)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Clients.Group(groupName).SendAsync("PaymentUpdated", paymentState);
    }

    public async Task BroadcastSaleCompleted(string registerId, object saleState)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Clients.Group(groupName).SendAsync("SaleCompleted", saleState);
    }

    public async Task BroadcastIdle(string registerId)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Clients.Group(groupName).SendAsync("DisplayIdle");
    }
}

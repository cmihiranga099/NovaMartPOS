using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NovaMartPOS.API.Hubs;

[AllowAnonymous]
public class CustomerDisplayHub : Hub
{
    private static readonly ConcurrentDictionary<string, (string EventName, object Data)> _latestStates = new();

    public async Task JoinRegister(string registerId)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // Immediately send the latest state to this newly connected client
        if (_latestStates.TryGetValue(groupName, out var latest))
        {
            await Clients.Caller.SendAsync(latest.EventName, latest.Data);
        }
    }

    public async Task LeaveRegister(string registerId)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task BroadcastCartUpdate(string registerId, object cartState)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        _latestStates[groupName] = ("CartUpdated", cartState);
        await Clients.Group(groupName).SendAsync("CartUpdated", cartState);
    }

    public async Task BroadcastPaymentUpdate(string registerId, object paymentState)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        _latestStates[groupName] = ("PaymentUpdated", paymentState);
        await Clients.Group(groupName).SendAsync("PaymentUpdated", paymentState);
    }

    public async Task BroadcastSaleCompleted(string registerId, object saleState)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        _latestStates[groupName] = ("SaleCompleted", saleState);
        await Clients.Group(groupName).SendAsync("SaleCompleted", saleState);
    }

    public async Task BroadcastIdle(string registerId)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        _latestStates.TryRemove(groupName, out _);
        await Clients.Group(groupName).SendAsync("DisplayIdle");
    }

    public async Task RequestCurrentState(string registerId)
    {
        var groupName = string.IsNullOrWhiteSpace(registerId) ? "default-register" : registerId.Trim();
        if (_latestStates.TryGetValue(groupName, out var latest))
        {
            await Clients.Caller.SendAsync(latest.EventName, latest.Data);
        }
    }
}

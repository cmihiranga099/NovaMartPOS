using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NovaMartPOS.API.Hubs;

[Authorize]
public class DashboardHub : Hub
{
}
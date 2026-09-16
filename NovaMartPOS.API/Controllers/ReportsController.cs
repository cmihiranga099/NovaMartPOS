using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(IReportService service)
    {
        _service = service;
    }

    [HttpGet("daily-sales")]
    public async Task<IActionResult> DailySales([FromQuery] DateTime? date = null)
        => Ok(await _service.GetDailySalesAsync(date ?? DateTime.UtcNow));

    [HttpGet("sales-by-cashier")]
    public async Task<IActionResult> SalesByCashier([FromQuery] DateTime from, [FromQuery] DateTime to)
        => Ok(await _service.GetSalesByCashierAsync(from, to));

    [HttpGet("top-products")]
    public async Task<IActionResult> TopProducts([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int take = 10)
        => Ok(await _service.GetTopProductsAsync(from, to, take));
}
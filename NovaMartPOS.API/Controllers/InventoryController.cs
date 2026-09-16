using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _service;

    public InventoryController(IInventoryService service)
    {
        _service = service;
    }

    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] CreateStockAdjustmentDto dto)
    {
        var (result, error) = await _service.AdjustStockAsync(dto);
        if (error is not null)
            return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int? productId = null)
        => Ok(await _service.GetHistoryAsync(productId));

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
        => Ok(await _service.GetLowStockProductsAsync());
}
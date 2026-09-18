using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _service;

    public PurchaseOrdersController(IPurchaseOrderService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Receive([FromBody] CreatePurchaseOrderDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Could not identify user from token." });

        var (purchaseOrder, error) = await _service.ReceiveAsync(dto, userId);

        if (error is not null)
            return BadRequest(new { message = error });

        return CreatedAtAction(nameof(GetById), new { id = purchaseOrder!.Id }, purchaseOrder);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var purchaseOrder = await _service.GetByIdAsync(id);
        return purchaseOrder is null ? NotFound() : Ok(purchaseOrder);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());
}
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISaleService _service;

    public SalesController(ISaleService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Checkout([FromBody] CreateSaleDto dto)
    {
        var cashierIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(cashierIdClaim, out var cashierId))
            return Unauthorized(new { message = "Could not identify cashier from token." });

        var (sale, error) = await _service.CheckoutAsync(dto, cashierId);

        if (error is not null)
            return BadRequest(new { message = error });

        return CreatedAtAction(nameof(GetById), new { id = sale!.Id }, sale);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sale = await _service.GetByIdAsync(id);
        return sale is null ? NotFound() : Ok(sale);
    }

    [HttpGet]
public async Task<IActionResult> GetAll()
    => Ok(await _service.GetAllAsync());
}
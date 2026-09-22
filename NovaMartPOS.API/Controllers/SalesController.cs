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
    private readonly IAuthService _authService;

    public SalesController(ISaleService service, IAuthService authService)
    {
        _service = service;
        _authService = authService;
    }

    [HttpPost]
    public async Task<IActionResult> Checkout([FromBody] CreateSaleDto dto)
    {
        var cashierIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(cashierIdClaim, out var cashierId))
            return Unauthorized(new { message = "Could not identify cashier from token." });

        
        if (User.IsInRole("Cashier") && dto.Items.Any(i => i.Discount > 0))
        {
            var pinCheck = await _authService.VerifyManagerPinAsync(dto.ManagerOverridePin ?? string.Empty);
            if (!pinCheck.Approved)
                return StatusCode(403, new { message = "Manager approval is required to apply a discount." });
        }

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
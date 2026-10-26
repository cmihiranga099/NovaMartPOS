using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ShiftsController : ControllerBase
{
    private readonly IShiftService _shiftService;

    public ShiftsController(IShiftService shiftService)
    {
        _shiftService = shiftService;
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveShift()
    {
        var cashierIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(cashierIdClaim, out var cashierId))
            return Unauthorized(new { message = "Could not identify user from token." });

        var activeShift = await _shiftService.GetActiveShiftAsync(cashierId);
        return Ok(activeShift);
    }

    [HttpPost("open")]
    public async Task<IActionResult> OpenShift([FromBody] OpenShiftDto dto)
    {
        var cashierIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(cashierIdClaim, out var cashierId))
            return Unauthorized(new { message = "Could not identify user from token." });

        var (shift, error) = await _shiftService.OpenShiftAsync(cashierId, dto);
        if (error is not null)
            return BadRequest(new { message = error });

        return Ok(shift);
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> CloseShift(int id, [FromBody] CloseShiftDto dto)
    {
        var cashierIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(cashierIdClaim, out var cashierId))
            return Unauthorized(new { message = "Could not identify user from token." });

        var (shift, error) = await _shiftService.CloseShiftAsync(id, cashierId, dto);
        if (error is not null)
            return BadRequest(new { message = error });

        return Ok(shift);
    }

    [HttpPost("{id}/cash-movement")]
    public async Task<IActionResult> AddCashMovement(int id, [FromBody] CashMovementRequestDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Could not identify user from token." });

        var (movement, error) = await _shiftService.AddCashMovementAsync(id, userId, dto);
        if (error is not null)
            return BadRequest(new { message = error });

        return Ok(movement);
    }

    [HttpGet("{id}/summary")]
    public async Task<IActionResult> GetSummary(int id)
    {
        var summary = await _shiftService.GetShiftSummaryAsync(id);
        if (summary is null)
            return NotFound(new { message = "Shift not found." });

        return Ok(summary);
    }

    [HttpGet]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var shifts = await _shiftService.GetAllShiftsAsync(from, to);
        return Ok(shifts);
    }
}

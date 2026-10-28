using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReturnsController : ControllerBase
{
    private readonly IReturnService _service;
    private readonly IAuthService _authService;

    public ReturnsController(IReturnService service, IAuthService authService)
    {
        _service = service;
        _authService = authService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReturnDto dto)
    {
        int? cashierId = null;
        var cashierIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(cashierIdClaim, out var parsedId))
            cashierId = parsedId;

        if (User.IsInRole("Cashier"))
        {
            var pinCheck = await _authService.VerifyManagerPinAsync(dto.ManagerOverridePin ?? string.Empty);
            if (!pinCheck.Approved)
                return StatusCode(403, new { message = "Manager approval PIN is required to process a return." });

            dto.ApprovedBy = pinCheck.ApprovedBy;
        }
        else
        {
            dto.ApprovedBy = User.Identity?.Name ?? "Manager";
        }

        var (result, error) = await _service.ProcessReturnAsync(dto, cashierId);
        if (error is not null)
            return BadRequest(new { message = error });

        return Ok(result);
    }
}

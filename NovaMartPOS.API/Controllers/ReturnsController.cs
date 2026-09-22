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

    // Voiding items off a completed sale. A Cashier may only do this with a
    // Manager/Administrator's PIN approving it — enforced here, not just hidden in the UI.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReturnDto dto)
    {
        if (User.IsInRole("Cashier"))
        {
            var pinCheck = await _authService.VerifyManagerPinAsync(dto.ManagerOverridePin ?? string.Empty);
            if (!pinCheck.Approved)
                return StatusCode(403, new { message = "Manager approval is required to process a return." });
        }

        var (result, error) = await _service.ProcessReturnAsync(dto);
        if (error is not null)
            return BadRequest(new { message = error });

        return Ok(result);
    }
}
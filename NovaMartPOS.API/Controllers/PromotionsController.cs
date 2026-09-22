using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionService _service;

    public PromotionsController(IPromotionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var promotion = await _service.GetByIdAsync(id);
        return promotion is null ? NotFound() : Ok(promotion);
    }

    [Authorize(Roles = "Administrator,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePromotionDto dto)
    {
        var (created, error) = await _service.CreateAsync(dto);
        if (created is null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Administrator,Manager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePromotionDto dto)
    {
        var (success, error) = await _service.UpdateAsync(id, dto);
        if (!success)
            return error == "Promotion not found." ? NotFound() : BadRequest(new { message = error });

        return NoContent();
    }

    [Authorize(Roles = "Administrator,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, error) = await _service.DeleteAsync(id);
        if (!success)
            return error == "Promotion not found." ? NotFound() : BadRequest(new { message = error });

        return NoContent();
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidatePromoDto dto)
    {
        var (valid, discount, error) = await _service.ValidateAsync(dto.Code, dto.Subtotal);
        return Ok(new PromoValidationResultDto
        {
            Valid = valid,
            Code = valid ? dto.Code.Trim().ToUpperInvariant() : null,
            DiscountAmount = discount,
            Error = error
        });
    }
}
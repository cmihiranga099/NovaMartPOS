using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BrandsController : ControllerBase
{
    private readonly IBrandService _service;

    public BrandsController(IBrandService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var brand = await _service.GetByIdAsync(id);
        return brand is null ? NotFound() : Ok(brand);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBrandDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBrandDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, error) = await _service.DeleteAsync(id);
        if (!success)
            return error == "Brand not found." ? NotFound() : BadRequest(new { message = error });

        return NoContent();
    }
}
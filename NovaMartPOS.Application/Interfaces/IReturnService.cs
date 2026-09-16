using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IReturnService
{
    Task<(ReturnDto? Result, string? Error)> ProcessReturnAsync(CreateReturnDto dto);
}
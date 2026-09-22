using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<VerifyPinResponseDto> VerifyManagerPinAsync(string pin);
}
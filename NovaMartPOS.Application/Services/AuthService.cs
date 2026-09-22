using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;

namespace NovaMartPOS.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _userRepository.GetByUsernameAsync(request.Username);

        if (user is null || !user.IsActive)
            return null;

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            return null;

        var (token, expiresAt) = _jwtTokenService.GenerateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            UserId = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            Role = user.Role.ToString()
        };
    }

    public async Task<VerifyPinResponseDto> VerifyManagerPinAsync(string pin)
    {
        if (string.IsNullOrWhiteSpace(pin))
            return new VerifyPinResponseDto { Approved = false };

        var approvers = await _userRepository.GetActiveManagersAndAdminsAsync();

        var match = approvers.FirstOrDefault(u => _passwordHasher.Verify(pin, u.PinHash!));

        return match is null
            ? new VerifyPinResponseDto { Approved = false }
            : new VerifyPinResponseDto { Approved = true, ApprovedBy = match.FullName };
    }
}
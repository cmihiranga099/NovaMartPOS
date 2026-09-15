using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}
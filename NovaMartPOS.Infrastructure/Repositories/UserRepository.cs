using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByUsernameAsync(string username)
        => await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

    public async Task<bool> AnyUsersExistAsync()
        => await _context.Users.AnyAsync();

    public async Task AddAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }

    public async Task<List<User>> GetActiveManagersAndAdminsAsync()
        => await _context.Users
            .Where(u => u.IsActive && (u.Role == UserRole.Manager || u.Role == UserRole.Administrator) && u.PinHash != null)
            .ToListAsync();
}
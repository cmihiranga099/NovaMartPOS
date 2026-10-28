using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Interfaces;

public interface IUserRepository
{
    Task<List<User>> GetAllAsync();
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByUsernameAsync(string username);
    Task<bool> AnyUsersExistAsync();
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task<List<User>> GetActiveManagersAndAdminsAsync();
}

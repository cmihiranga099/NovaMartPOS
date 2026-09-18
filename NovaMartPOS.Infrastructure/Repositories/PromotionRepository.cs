using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Infrastructure.Persistence;

namespace NovaMartPOS.Infrastructure.Repositories;

public class PromotionRepository : IPromotionRepository
{
    private readonly AppDbContext _context;

    public PromotionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Promotion>> GetAllAsync()
        => await _context.Promotions.AsNoTracking().OrderByDescending(p => p.CreatedAt).ToListAsync();

    public async Task<Promotion?> GetByIdAsync(int id)
        => await _context.Promotions.FindAsync(id);

    public async Task<Promotion?> GetByCodeAsync(string code)
        => await _context.Promotions.FirstOrDefaultAsync(p => p.Code.ToLower() == code.ToLower());

    public async Task AddAsync(Promotion promotion)
    {
        _context.Promotions.Add(promotion);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Promotion promotion)
    {
        _context.Promotions.Update(promotion);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Promotion promotion)
    {
        _context.Promotions.Remove(promotion);
        await _context.SaveChangesAsync();
    }
}
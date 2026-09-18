using NovaMartPOS.Application.DTOs;

namespace NovaMartPOS.Application.Interfaces;

public interface IPromotionService
{
    Task<List<PromotionDto>> GetAllAsync();
    Task<PromotionDto?> GetByIdAsync(int id);
    Task<(PromotionDto? Promotion, string? Error)> CreateAsync(CreatePromotionDto dto);
    Task<(bool Success, string? Error)> UpdateAsync(int id, UpdatePromotionDto dto);
    Task<(bool Success, string? Error)> DeleteAsync(int id);
    Task<(bool Valid, decimal DiscountAmount, string? Error)> ValidateAsync(string code, decimal subtotal);
}
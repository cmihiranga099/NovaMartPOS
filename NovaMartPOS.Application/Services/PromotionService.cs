using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Application.Services;

public class PromotionService : IPromotionService
{
    private readonly IPromotionRepository _repository;

    public PromotionService(IPromotionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PromotionDto>> GetAllAsync()
    {
        var promotions = await _repository.GetAllAsync();
        return promotions.Select(MapToDto).ToList();
    }

    public async Task<PromotionDto?> GetByIdAsync(int id)
    {
        var promotion = await _repository.GetByIdAsync(id);
        return promotion is null ? null : MapToDto(promotion);
    }

    public async Task<(PromotionDto? Promotion, string? Error)> CreateAsync(CreatePromotionDto dto)
    {
        var (valid, type, error) = ValidateInput(dto.Code, dto.Type, dto.Value);
        if (!valid) return (null, error);

        var existing = await _repository.GetByCodeAsync(dto.Code);
        if (existing is not null) return (null, "A promotion with this code already exists.");

        var promotion = new Promotion
        {
            Code = dto.Code.Trim().ToUpperInvariant(),
            Description = dto.Description,
            Type = type,
            Value = dto.Value,
            MinPurchaseAmount = dto.MinPurchaseAmount,
            MaxDiscountAmount = dto.MaxDiscountAmount,
            ExpiresAt = dto.ExpiresAt,
            IsActive = true
        };

        await _repository.AddAsync(promotion);
        return (MapToDto(promotion), null);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(int id, UpdatePromotionDto dto)
    {
        var (valid, type, error) = ValidateInput(dto.Code, dto.Type, dto.Value);
        if (!valid) return (false, error);

        var promotion = await _repository.GetByIdAsync(id);
        if (promotion is null) return (false, "Promotion not found.");

        var existing = await _repository.GetByCodeAsync(dto.Code);
        if (existing is not null && existing.Id != id) return (false, "A promotion with this code already exists.");

        promotion.Code = dto.Code.Trim().ToUpperInvariant();
        promotion.Description = dto.Description;
        promotion.Type = type;
        promotion.Value = dto.Value;
        promotion.MinPurchaseAmount = dto.MinPurchaseAmount;
        promotion.MaxDiscountAmount = dto.MaxDiscountAmount;
        promotion.ExpiresAt = dto.ExpiresAt;
        promotion.IsActive = dto.IsActive;
        promotion.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(promotion);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var promotion = await _repository.GetByIdAsync(id);
        if (promotion is null) return (false, "Promotion not found.");

        await _repository.DeleteAsync(promotion);
        return (true, null);
    }

    public async Task<(bool Valid, decimal DiscountAmount, string? Error)> ValidateAsync(string code, decimal subtotal)
    {
        if (string.IsNullOrWhiteSpace(code))
            return (false, 0, "Enter a promo code.");

        var promotion = await _repository.GetByCodeAsync(code.Trim());
        if (promotion is null)
            return (false, 0, "Invalid promo code.");

        if (!promotion.IsActive)
            return (false, 0, "This promo code is no longer active.");

        if (promotion.ExpiresAt.HasValue && promotion.ExpiresAt.Value < DateTime.UtcNow)
            return (false, 0, "This promo code has expired.");

        if (subtotal < promotion.MinPurchaseAmount)
            return (false, 0, $"Minimum purchase of {promotion.MinPurchaseAmount:F2} required for this promo code.");

        var discount = promotion.Type == PromotionType.Percentage
            ? subtotal * (promotion.Value / 100m)
            : promotion.Value;

        if (promotion.MaxDiscountAmount.HasValue && discount > promotion.MaxDiscountAmount.Value)
            discount = promotion.MaxDiscountAmount.Value;

        if (discount > subtotal)
            discount = subtotal;

        return (true, Math.Round(discount, 2), null);
    }

    private static (bool Valid, PromotionType Type, string? Error) ValidateInput(string code, string typeStr, decimal value)
    {
        if (string.IsNullOrWhiteSpace(code))
            return (false, default, "Promo code is required.");

        if (!Enum.TryParse<PromotionType>(typeStr, true, out var type))
            return (false, default, "Type must be Percentage or FixedAmount.");

        if (value <= 0)
            return (false, default, "Value must be greater than zero.");

        if (type == PromotionType.Percentage && value > 100)
            return (false, default, "Percentage value cannot exceed 100.");

        return (true, type, null);
    }

    private static PromotionDto MapToDto(Promotion p) => new()
    {
        Id = p.Id,
        Code = p.Code,
        Description = p.Description,
        Type = p.Type.ToString(),
        Value = p.Value,
        MinPurchaseAmount = p.MinPurchaseAmount,
        MaxDiscountAmount = p.MaxDiscountAmount,
        ExpiresAt = p.ExpiresAt,
        IsActive = p.IsActive
    };
}
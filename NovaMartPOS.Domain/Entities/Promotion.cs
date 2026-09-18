using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Domain.Entities;

public class Promotion : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PromotionType Type { get; set; }
    public decimal Value { get; set; }
    public decimal MinPurchaseAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}
namespace NovaMartPOS.Application.DTOs;

public class PromotionDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal MinPurchaseAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePromotionDto
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Percentage";
    public decimal Value { get; set; }
    public decimal MinPurchaseAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class UpdatePromotionDto
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Percentage";
    public decimal Value { get; set; }
    public decimal MinPurchaseAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
}

public class ValidatePromoDto
{
    public string Code { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
}

public class PromoValidationResultDto
{
    public bool Valid { get; set; }
    public string? Code { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? Error { get; set; }
}
namespace NovaMartPOS.Domain.Entities;

public class ReturnItem : BaseEntity
{
    public int ReturnId { get; set; }
    public Return Return { get; set; } = null!;

    public int SaleItemId { get; set; }
    public SaleItem SaleItem { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal RefundAmount { get; set; }
    public string? Reason { get; set; }
}
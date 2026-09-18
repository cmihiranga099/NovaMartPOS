namespace NovaMartPOS.Domain.Entities;

public class PurchaseOrder : BaseEntity
{
    public string PoNumber { get; set; } = string.Empty;
    public decimal TotalCost { get; set; }
    public string? Notes { get; set; }

    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;

    public int ReceivedById { get; set; }
    public User ReceivedBy { get; set; } = null!;

    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}
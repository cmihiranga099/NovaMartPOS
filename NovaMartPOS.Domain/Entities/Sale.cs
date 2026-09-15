namespace NovaMartPOS.Domain.Entities;

public class Sale : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public int CashierId { get; set; }
    public User Cashier { get; set; } = null!;

    public ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
    public Payment? Payment { get; set; }
}
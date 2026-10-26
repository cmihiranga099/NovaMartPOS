namespace NovaMartPOS.Domain.Entities;

public class Product : BaseEntity
{
    public string ProductCode { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal StockQuantity { get; set; }
    public decimal MinimumStockLevel { get; set; }
    public bool IsWeighable { get; set; } = false;
    public string UnitOfMeasure { get; set; } = "pcs"; // kg, g, pcs, pack, l
    public bool IsActive { get; set; } = true;

    // Null for products that don't expire (hardware, non-perishables, etc).
    public DateTime? ExpiryDate { get; set; }

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public int BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
}

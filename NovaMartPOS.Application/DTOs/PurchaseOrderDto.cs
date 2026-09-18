namespace NovaMartPOS.Application.DTOs;

public class PurchaseOrderItemRequestDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
}

public class CreatePurchaseOrderDto
{
    public int SupplierId { get; set; }
    public List<PurchaseOrderItemRequestDto> Items { get; set; } = new();
    public string? Notes { get; set; }
}

public class PurchaseOrderItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Total { get; set; }
}

public class PurchaseOrderDto
{
    public int Id { get; set; }
    public string PoNumber { get; set; } = string.Empty;
    public decimal TotalCost { get; set; }
    public string? Notes { get; set; }
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public int ReceivedById { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<PurchaseOrderItemDto> Items { get; set; } = new();
}
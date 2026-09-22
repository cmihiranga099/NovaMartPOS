namespace NovaMartPOS.Application.DTOs;

public class ReturnItemRequestDto
{
    public int SaleItemId { get; set; }
    public int Quantity { get; set; }
    public string? Reason { get; set; }
}

public class CreateReturnDto
{
    public int SaleId { get; set; }
    public List<ReturnItemRequestDto> Items { get; set; } = new();
    
    public string? ManagerOverridePin { get; set; }
}

public class ReturnItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal RefundAmount { get; set; }
    public string? Reason { get; set; }
}

public class ReturnDto
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal TotalRefund { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ReturnItemDto> Items { get; set; } = new();
}
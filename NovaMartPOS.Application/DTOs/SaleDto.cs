namespace NovaMartPOS.Application.DTOs;

public class SaleItemRequestDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal Discount { get; set; } = 0;
}

public class CreateSaleDto
{
    public int CustomerId { get; set; }
    public List<SaleItemRequestDto> Items { get; set; } = new();
    public string PaymentMethod { get; set; } = "Cash";
    public decimal AmountPaid { get; set; }
}

public class SaleItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
}

public class SaleDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal Change { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<SaleItemDto> Items { get; set; } = new();
}
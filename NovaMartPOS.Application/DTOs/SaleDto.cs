namespace NovaMartPOS.Application.DTOs;

public class SaleItemRequestDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal Discount { get; set; } = 0;
}

public class PaymentSplitDto
{
    public string Method { get; set; } = "Cash";
    public decimal Amount { get; set; }
}

public class CreateSaleDto
{
    public int CustomerId { get; set; }
    public List<SaleItemRequestDto> Items { get; set; } = new();
    
    // For single payment (or primary tender summary):
    public string PaymentMethod { get; set; } = "Cash";
    public decimal AmountPaid { get; set; }

    // For multi-tender split payments (e.g. Cash: 2000, Card: 3000):
    public List<PaymentSplitDto>? Splits { get; set; }

    public string? PromoCode { get; set; }
    public string? ManagerOverridePin { get; set; }
}

public class SaleItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string UnitOfMeasure { get; set; } = "pcs";
    public bool IsWeighable { get; set; } = false;
}

public class PaymentDetailDto
{
    public string Method { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public decimal Change { get; set; }
}

public class SaleDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }
    public string? PromoCode { get; set; }
    public decimal PromoDiscount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal Change { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<SaleItemDto> Items { get; set; } = new();
    public List<PaymentDetailDto> Payments { get; set; } = new();
}

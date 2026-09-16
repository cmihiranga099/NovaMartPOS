namespace NovaMartPOS.Application.DTOs;

public class CreateStockAdjustmentDto
{
    public int ProductId { get; set; }
    public string Type { get; set; } = string.Empty; // "AdjustmentIn" or "AdjustmentOut"
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}

public class StockTransactionDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
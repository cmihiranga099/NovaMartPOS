using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Domain.Entities;

public class StockTransaction : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public StockTransactionType Type { get; set; }
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}
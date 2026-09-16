namespace NovaMartPOS.Domain.Entities;

public class Return : BaseEntity
{
    public int SaleId { get; set; }
    public Sale Sale { get; set; } = null!;

    public decimal TotalRefund { get; set; }

    public ICollection<ReturnItem> ReturnItems { get; set; } = new List<ReturnItem>();
}
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Domain.Entities;

public class Shift : BaseEntity
{
    public int CashierId { get; set; }
    public User? Cashier { get; set; }

    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }

    public ShiftStatus Status { get; set; } = ShiftStatus.Open;

    public decimal StartingCash { get; set; }
    public decimal? EndingCash { get; set; }
    public decimal? ExpectedCash { get; set; }
    public decimal? CashDifference { get; set; }

    public string? Notes { get; set; }

    public ICollection<CashMovement> CashMovements { get; set; } = new List<CashMovement>();
}

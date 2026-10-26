using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Domain.Entities;

public class CashMovement : BaseEntity
{
    public int ShiftId { get; set; }
    public Shift? Shift { get; set; }

    public CashMovementType Type { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;

    public int UserId { get; set; }
    public User? User { get; set; }
}

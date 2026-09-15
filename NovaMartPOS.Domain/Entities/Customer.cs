namespace NovaMartPOS.Domain.Entities;

public class Customer : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int LoyaltyPoints { get; set; }
    public bool IsActive { get; set; } = true;
}
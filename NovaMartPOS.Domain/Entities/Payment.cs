using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Domain.Entities;

public class Payment : BaseEntity
{
    public int SaleId { get; set; }
    public Sale Sale { get; set; } = null!;

    public PaymentMethod Method { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal Change { get; set; }
}
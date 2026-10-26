namespace NovaMartPOS.Application.DTOs;

public class OpenShiftDto
{
    public decimal StartingCash { get; set; }
    public string? Notes { get; set; }
}

public class CloseShiftDto
{
    public decimal CountedCash { get; set; }
    public string? Notes { get; set; }
}

public class CashMovementRequestDto
{
    public string Type { get; set; } = "CashIn"; // CashIn or CashOut
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class CashMovementDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ShiftSummaryDto
{
    public int ShiftId { get; set; }
    public int CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = "Open";

    public decimal StartingCash { get; set; }
    public decimal CashSales { get; set; }
    public decimal CardSales { get; set; }
    public decimal BankSales { get; set; }
    public decimal TotalSales { get; set; }
    public int TotalTransactions { get; set; }

    public decimal CashIn { get; set; }
    public decimal CashOut { get; set; }
    public decimal TotalRefunds { get; set; }
    public int TotalRefundTransactions { get; set; }

    public decimal ExpectedCash { get; set; }
    public decimal? CountedCash { get; set; }
    public decimal? Variance { get; set; } // CountedCash - ExpectedCash (Shortage if negative, Overage if positive)

    public string? Notes { get; set; }
    public List<CashMovementDto> CashMovements { get; set; } = new();
}

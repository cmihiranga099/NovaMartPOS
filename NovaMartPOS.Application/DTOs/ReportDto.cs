namespace NovaMartPOS.Application.DTOs;

public class DailySalesReportDto
{
    public DateTime Date { get; set; }
    public int TransactionCount { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal TotalTax { get; set; }
    public decimal TotalProfit { get; set; }
}

public class CashierSalesReportDto
{
    public int CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public int TransactionCount { get; set; }
    public decimal TotalSales { get; set; }
}

public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}
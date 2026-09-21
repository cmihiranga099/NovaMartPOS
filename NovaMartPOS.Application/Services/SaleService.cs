using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Application.Services;

public class SaleService : ISaleService
{
    private readonly ISaleRepository _saleRepository;
    private readonly IProductRepository _productRepository;
    private readonly IPromotionService _promotionService;
    private readonly INotificationService _notificationService;

    public SaleService(
        ISaleRepository saleRepository,
        IProductRepository productRepository,
        IPromotionService promotionService,
        INotificationService notificationService)
    {
        _saleRepository = saleRepository;
        _productRepository = productRepository;
        _promotionService = promotionService;
        _notificationService = notificationService;
    }

    public async Task<(SaleDto? Sale, string? Error)> CheckoutAsync(CreateSaleDto dto, int cashierId)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            return (null, "Cart is empty.");

        if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var paymentMethod))
            return (null, "Invalid payment method. Use Cash, Card, or BankTransfer.");

        decimal subtotal = 0;
        decimal totalDiscount = 0;
        decimal totalTax = 0;

        var saleItems = new List<SaleItem>();
        var stockTransactions = new List<StockTransaction>();
        var productsToDeduct = new List<(Product Product, int Quantity)>();

        // Validate every line BEFORE making any changes
        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0)
                return (null, "Item quantity must be greater than zero.");

            var product = await _productRepository.GetByIdAsync(item.ProductId);

            if (product is null || !product.IsActive)
                return (null, $"Product with ID {item.ProductId} is not available.");

            if (product.StockQuantity < item.Quantity)
                return (null, $"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}, requested: {item.Quantity}.");

            if (item.Discount < 0 || item.Discount > product.SellingPrice * item.Quantity)
                return (null, $"Invalid discount for '{product.Name}'.");

            var lineGross = product.SellingPrice * item.Quantity;
            var lineTotal = lineGross - item.Discount;
            var lineTax = lineTotal * (product.TaxRate / 100m);

            subtotal += lineGross;
            totalDiscount += item.Discount;
            totalTax += lineTax;

            saleItems.Add(new SaleItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.SellingPrice,
                Discount = item.Discount,
                Total = lineTotal
            });

            productsToDeduct.Add((product, item.Quantity));
        }

        var netAfterLineDiscounts = subtotal - totalDiscount;
        decimal promoDiscount = 0;
        string? appliedPromoCode = null;

        if (!string.IsNullOrWhiteSpace(dto.PromoCode))
        {
            var (valid, discount, error) = await _promotionService.ValidateAsync(dto.PromoCode, netAfterLineDiscounts);
            if (!valid)
                return (null, error ?? "Invalid promo code.");

            promoDiscount = discount;
            appliedPromoCode = dto.PromoCode.Trim().ToUpperInvariant();
        }

        var grandTotal = (netAfterLineDiscounts - promoDiscount) + totalTax;

        if (dto.AmountPaid < grandTotal)
            return (null, $"Insufficient payment. Grand total is {grandTotal:F2}, amount paid was {dto.AmountPaid:F2}.");

        var invoiceNumber = await _saleRepository.GenerateInvoiceNumberAsync();

        var sale = new Sale
        {
            InvoiceNumber = invoiceNumber,
            Subtotal = subtotal,
            Discount = totalDiscount,
            Tax = totalTax,
            GrandTotal = grandTotal,
            PromoCode = appliedPromoCode,
            PromoDiscount = promoDiscount,
            CustomerId = dto.CustomerId,
            CashierId = cashierId,
            SaleItems = saleItems,
            Payment = new Payment
            {
                Method = paymentMethod,
                AmountPaid = dto.AmountPaid,
                Change = dto.AmountPaid - grandTotal
            }
        };

        // Deduct stock and record stock transactions
        foreach (var (product, quantity) in productsToDeduct)
        {
            product.StockQuantity -= quantity;
            product.UpdatedAt = DateTime.UtcNow;

            stockTransactions.Add(new StockTransaction
            {
                ProductId = product.Id,
                Type = StockTransactionType.Sale,
                Quantity = quantity,
                Notes = $"Sale {invoiceNumber}"
            });
        }

        await _saleRepository.CreateSaleAsync(sale, stockTransactions);

        var saved = await _saleRepository.GetByIdWithDetailsAsync(sale.Id);
        var saleDto = MapToDto(saved!);

        try
        {
            await _notificationService.NotifySaleCompletedAsync(saleDto);
        }
        catch
        {
            // A dashboard broadcast failing must never fail the sale itself — the sale is already committed.
        }

        return (saleDto, null);
    }

    public async Task<SaleDto?> GetByIdAsync(int id)
    {
        var sale = await _saleRepository.GetByIdWithDetailsAsync(id);
        return sale is null ? null : MapToDto(sale);
    }

    public async Task<List<SaleDto>> GetAllAsync()
{
    var sales = await _saleRepository.GetAllWithDetailsAsync();
    return sales.Select(MapToDto).ToList();
}

    private static SaleDto MapToDto(Sale s) => new()
    {
        Id = s.Id,
        InvoiceNumber = s.InvoiceNumber,
        Subtotal = s.Subtotal,
        Discount = s.Discount,
        Tax = s.Tax,
        GrandTotal = s.GrandTotal,
        PromoCode = s.PromoCode,
        PromoDiscount = s.PromoDiscount,
        AmountPaid = s.Payment?.AmountPaid ?? 0,
        Change = s.Payment?.Change ?? 0,
        PaymentMethod = s.Payment?.Method.ToString() ?? string.Empty,
        CustomerId = s.CustomerId,
        CustomerName = s.Customer?.Name ?? string.Empty,
        CashierId = s.CashierId,
        CashierName = s.Cashier?.FullName ?? string.Empty,
        CreatedAt = s.CreatedAt,
        Items = s.SaleItems.Select(si => new SaleItemDto
        {
            ProductId = si.ProductId,
            ProductName = si.Product?.Name ?? string.Empty,
            Quantity = si.Quantity,
            UnitPrice = si.UnitPrice,
            Discount = si.Discount,
            Total = si.Total
        }).ToList()
    };
}
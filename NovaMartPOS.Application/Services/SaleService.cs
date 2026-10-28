using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Application.Services;

public class SaleService : ISaleService
{
    private readonly ISaleRepository _saleRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IPromotionService _promotionService;
    private readonly INotificationService _notificationService;

    public SaleService(
        ISaleRepository saleRepository,
        IProductRepository productRepository,
        ICustomerRepository customerRepository,
        IPromotionService promotionService,
        INotificationService notificationService)
    {
        _saleRepository = saleRepository;
        _productRepository = productRepository;
        _customerRepository = customerRepository;
        _promotionService = promotionService;
        _notificationService = notificationService;
    }

    public async Task<(SaleDto? Sale, string? Error)> CheckoutAsync(CreateSaleDto dto, int cashierId)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            return (null, "Cart is empty.");

        decimal subtotal = 0;
        decimal totalDiscount = 0;
        decimal totalTax = 0;

        var saleItems = new List<SaleItem>();
        var stockTransactions = new List<StockTransaction>();
        var productsToDeduct = new List<(Product Product, decimal Quantity)>();

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

        // Process payments (Supports both single tender and multi-tender splits)
        var payments = new List<Payment>();
        decimal totalTendered = 0;

        if (dto.Splits is not null && dto.Splits.Count > 0)
        {
            foreach (var split in dto.Splits)
            {
                if (split.Amount <= 0)
                    return (null, "Split payment amount must be greater than zero.");

                if (!Enum.TryParse<PaymentMethod>(split.Method, true, out _))
                    return (null, $"Invalid payment method '{split.Method}'.");

                totalTendered += split.Amount;
            }

            if (totalTendered < grandTotal)
                return (null, $"Insufficient payment. Grand total is {grandTotal:F2}, total tendered across splits was {totalTendered:F2}.");

            for (int i = 0; i < dto.Splits.Count; i++)
            {
                var split = dto.Splits[i];
                Enum.TryParse<PaymentMethod>(split.Method, true, out var splitMethod);
                decimal changeForSplit = (i == dto.Splits.Count - 1 && totalTendered > grandTotal)
                    ? totalTendered - grandTotal
                    : 0;

                payments.Add(new Payment
                {
                    Method = splitMethod,
                    AmountPaid = split.Amount,
                    Change = changeForSplit
                });
            }
        }
        else
        {
            if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var paymentMethod))
                return (null, "Invalid payment method. Use Cash, Card, or BankTransfer.");

            if (dto.AmountPaid < grandTotal)
                return (null, $"Insufficient payment. Grand total is {grandTotal:F2}, amount paid was {dto.AmountPaid:F2}.");

            totalTendered = dto.AmountPaid;
            payments.Add(new Payment
            {
                Method = paymentMethod,
                AmountPaid = dto.AmountPaid,
                Change = dto.AmountPaid - grandTotal
            });
        }

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
            Payments = payments
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

        // Accrue loyalty points for registered customers (1 point per Rs. 100 spent)
        int loyaltyPointsEarned = 0;
        int customerLoyaltyBalance = 0;
        if (dto.CustomerId > 0)
        {
            var customer = await _customerRepository.GetByIdAsync(dto.CustomerId);
            if (customer != null && !customer.Name.Equals("Walk-in Customer", StringComparison.OrdinalIgnoreCase))
            {
                loyaltyPointsEarned = (int)(grandTotal / 100m);
                if (loyaltyPointsEarned > 0)
                {
                    customer.LoyaltyPoints += loyaltyPointsEarned;
                    customer.UpdatedAt = DateTime.UtcNow;
                    await _customerRepository.UpdateAsync(customer);
                }
                customerLoyaltyBalance = customer.LoyaltyPoints;
            }
        }

        await _saleRepository.CreateSaleAsync(sale, stockTransactions);

        var saved = await _saleRepository.GetByIdWithDetailsAsync(sale.Id);
        var saleDto = MapToDto(saved!);
        saleDto.LoyaltyPointsEarned = loyaltyPointsEarned;
        if (customerLoyaltyBalance > 0)
        {
            saleDto.CustomerLoyaltyBalance = customerLoyaltyBalance;
        }

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

    public async Task<List<SaleDto>> GetAllAsync()
    {
        var sales = await _saleRepository.GetAllWithDetailsAsync();
        return sales.Select(MapToDto).ToList();
    }

    public async Task<SaleDto?> GetByIdAsync(int id)
    {
        var sale = await _saleRepository.GetByIdWithDetailsAsync(id);
        return sale is null ? null : MapToDto(sale);
    }

    private static SaleDto MapToDto(Sale s)
    {
        var totalPaid = s.Payments.Sum(p => p.AmountPaid);
        var totalChange = s.Payments.Sum(p => p.Change);
        var methods = s.Payments.Count > 0
            ? string.Join(" + ", s.Payments.Select(p => p.Method.ToString()).Distinct())
            : "Cash";

        int pointsEarned = (s.Customer != null && !s.Customer.Name.Equals("Walk-in Customer", StringComparison.OrdinalIgnoreCase))
            ? (int)(s.GrandTotal / 100m)
            : 0;
        int loyaltyBalance = s.Customer?.LoyaltyPoints ?? 0;

        return new SaleDto
        {
            Id = s.Id,
            InvoiceNumber = s.InvoiceNumber,
            Subtotal = s.Subtotal,
            Discount = s.Discount,
            Tax = s.Tax,
            GrandTotal = s.GrandTotal,
            PromoCode = s.PromoCode,
            PromoDiscount = s.PromoDiscount,
            AmountPaid = totalPaid,
            Change = totalChange,
            PaymentMethod = methods,
            CustomerId = s.CustomerId,
            CustomerName = s.Customer?.Name ?? string.Empty,
            LoyaltyPointsEarned = pointsEarned,
            CustomerLoyaltyBalance = loyaltyBalance,
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
                Total = si.Total,
                UnitOfMeasure = si.Product?.UnitOfMeasure ?? "pcs",
                IsWeighable = si.Product?.IsWeighable ?? false
            }).ToList(),
            Payments = s.Payments.Select(p => new PaymentDetailDto
            {
                Method = p.Method.ToString(),
                AmountPaid = p.AmountPaid,
                Change = p.Change
            }).ToList()
        };
    }
}

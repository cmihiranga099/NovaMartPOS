using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Application.Services;

public class ReturnService : IReturnService
{
    private readonly IReturnRepository _returnRepository;

    public ReturnService(IReturnRepository returnRepository)
    {
        _returnRepository = returnRepository;
    }

    public async Task<(ReturnDto? Result, string? Error)> ProcessReturnAsync(CreateReturnDto dto)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            return (null, "No items specified for return.");

        var sale = await _returnRepository.GetSaleWithItemsAsync(dto.SaleId);
        if (sale is null)
            return (null, "Original sale not found.");

        var returnItems = new List<ReturnItem>();
        var stockTransactions = new List<StockTransaction>();
        var productsToUpdate = new List<Product>();
        decimal totalRefund = 0;

        foreach (var itemReq in dto.Items)
        {
            var saleItem = sale.SaleItems.FirstOrDefault(si => si.Id == itemReq.SaleItemId);
            if (saleItem is null)
                return (null, $"Sale item {itemReq.SaleItemId} does not belong to this sale.");

            if (itemReq.Quantity <= 0)
                return (null, "Return quantity must be greater than zero.");

            var alreadyReturned = await _returnRepository.GetAlreadyReturnedQuantityAsync(saleItem.Id);
            var maxReturnable = saleItem.Quantity - alreadyReturned;

            if (itemReq.Quantity > maxReturnable)
                return (null, $"Cannot return {itemReq.Quantity} units of '{saleItem.Product?.Name}' — only {maxReturnable} remaining returnable (already returned: {alreadyReturned}).");

            var refundAmount = saleItem.UnitPrice * itemReq.Quantity;
            totalRefund += refundAmount;

            returnItems.Add(new ReturnItem
            {
                SaleItemId = saleItem.Id,
                Quantity = itemReq.Quantity,
                RefundAmount = refundAmount,
                Reason = itemReq.Reason
            });

            var product = saleItem.Product!;
            product.StockQuantity += itemReq.Quantity;
            product.UpdatedAt = DateTime.UtcNow;
            productsToUpdate.Add(product);

            stockTransactions.Add(new StockTransaction
            {
                ProductId = product.Id,
                Type = StockTransactionType.Return,
                Quantity = itemReq.Quantity,
                Notes = $"Return against {sale.InvoiceNumber}"
            });
        }

        var returnRecord = new Return
        {
            SaleId = sale.Id,
            TotalRefund = totalRefund,
            ReturnItems = returnItems
        };

        await _returnRepository.CreateReturnAsync(returnRecord, stockTransactions, productsToUpdate);

        return (new ReturnDto
        {
            Id = returnRecord.Id,
            SaleId = sale.Id,
            InvoiceNumber = sale.InvoiceNumber,
            TotalRefund = totalRefund,
            CreatedAt = returnRecord.CreatedAt,
            Items = returnItems.Select(ri => new ReturnItemDto
            {
                ProductId = sale.SaleItems.First(si => si.Id == ri.SaleItemId).ProductId,
                ProductName = sale.SaleItems.First(si => si.Id == ri.SaleItemId).Product?.Name ?? string.Empty,
                Quantity = ri.Quantity,
                UnitPrice = sale.SaleItems.First(si => si.Id == ri.SaleItemId).UnitPrice,
                RefundAmount = ri.RefundAmount,
                Reason = ri.Reason
            }).ToList()
        }, null);
    }
}
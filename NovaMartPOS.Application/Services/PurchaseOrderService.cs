using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;

namespace NovaMartPOS.Application.Services;

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly IPurchaseOrderRepository _purchaseOrderRepository;
    private readonly IProductRepository _productRepository;
    private readonly ISupplierRepository _supplierRepository;

    public PurchaseOrderService(
        IPurchaseOrderRepository purchaseOrderRepository,
        IProductRepository productRepository,
        ISupplierRepository supplierRepository)
    {
        _purchaseOrderRepository = purchaseOrderRepository;
        _productRepository = productRepository;
        _supplierRepository = supplierRepository;
    }

    public async Task<(PurchaseOrderDto? PurchaseOrder, string? Error)> ReceiveAsync(CreatePurchaseOrderDto dto, int receivedById)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            return (null, "Add at least one item to the purchase order.");

        var supplier = await _supplierRepository.GetByIdAsync(dto.SupplierId);
        if (supplier is null || !supplier.IsActive)
            return (null, "Supplier not found or inactive.");

        decimal totalCost = 0;
        var poItems = new List<PurchaseOrderItem>();
        var stockTransactions = new List<StockTransaction>();
        var productsToRestock = new List<(Product Product, int Quantity, decimal UnitCost)>();

        // Validate every line BEFORE making any changes
        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0)
                return (null, "Item quantity must be greater than zero.");

            if (item.UnitCost < 0)
                return (null, "Unit cost cannot be negative.");

            var product = await _productRepository.GetByIdAsync(item.ProductId);
            if (product is null || !product.IsActive)
                return (null, $"Product with ID {item.ProductId} is not available.");

            var lineTotal = item.UnitCost * item.Quantity;
            totalCost += lineTotal;

            poItems.Add(new PurchaseOrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost,
                Total = lineTotal
            });

            productsToRestock.Add((product, item.Quantity, item.UnitCost));
        }

        var poNumber = await _purchaseOrderRepository.GeneratePoNumberAsync();

        var purchaseOrder = new PurchaseOrder
        {
            PoNumber = poNumber,
            TotalCost = totalCost,
            Notes = dto.Notes,
            SupplierId = dto.SupplierId,
            ReceivedById = receivedById,
            Items = poItems
        };

        // Receive stock immediately and refresh cost price with the latest purchase cost
        foreach (var (product, quantity, unitCost) in productsToRestock)
        {
            product.StockQuantity += quantity;
            product.PurchasePrice = unitCost;
            product.UpdatedAt = DateTime.UtcNow;

            stockTransactions.Add(new StockTransaction
            {
                ProductId = product.Id,
                Type = StockTransactionType.Purchase,
                Quantity = quantity,
                Notes = $"Purchase {poNumber}"
            });
        }

        await _purchaseOrderRepository.CreateAsync(purchaseOrder, stockTransactions);

        var saved = await _purchaseOrderRepository.GetByIdWithDetailsAsync(purchaseOrder.Id);
        return (MapToDto(saved!), null);
    }

    public async Task<PurchaseOrderDto?> GetByIdAsync(int id)
    {
        var po = await _purchaseOrderRepository.GetByIdWithDetailsAsync(id);
        return po is null ? null : MapToDto(po);
    }

    public async Task<List<PurchaseOrderDto>> GetAllAsync()
    {
        var orders = await _purchaseOrderRepository.GetAllWithDetailsAsync();
        return orders.Select(MapToDto).ToList();
    }

    private static PurchaseOrderDto MapToDto(PurchaseOrder po) => new()
    {
        Id = po.Id,
        PoNumber = po.PoNumber,
        TotalCost = po.TotalCost,
        Notes = po.Notes,
        SupplierId = po.SupplierId,
        SupplierName = po.Supplier?.Name ?? string.Empty,
        ReceivedById = po.ReceivedById,
        ReceivedByName = po.ReceivedBy?.FullName ?? string.Empty,
        CreatedAt = po.CreatedAt,
        Items = po.Items.Select(i => new PurchaseOrderItemDto
        {
            ProductId = i.ProductId,
            ProductName = i.Product?.Name ?? string.Empty,
            Quantity = i.Quantity,
            UnitCost = i.UnitCost,
            Total = i.Total
        }).ToList()
    };
}
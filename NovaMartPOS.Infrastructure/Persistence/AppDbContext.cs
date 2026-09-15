using Microsoft.EntityFrameworkCore;
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Product>()
            .HasIndex(p => p.Barcode)
            .IsUnique();

        modelBuilder.Entity<Product>()
            .HasIndex(p => p.ProductCode)
            .IsUnique();

        modelBuilder.Entity<Sale>()
            .HasIndex(s => s.InvoiceNumber)
            .IsUnique();

        // Decimal precision — never let EF pick a default for money fields
        modelBuilder.Entity<Product>()
            .Property(p => p.PurchasePrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Product>()
            .Property(p => p.SellingPrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Product>()
            .Property(p => p.TaxRate).HasColumnType("decimal(5,2)");

        modelBuilder.Entity<Sale>()
            .Property(s => s.Subtotal).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Sale>()
            .Property(s => s.Discount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Sale>()
            .Property(s => s.Tax).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Sale>()
            .Property(s => s.GrandTotal).HasColumnType("decimal(18,2)");

        modelBuilder.Entity<SaleItem>()
            .Property(si => si.UnitPrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<SaleItem>()
            .Property(si => si.Discount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<SaleItem>()
            .Property(si => si.Total).HasColumnType("decimal(18,2)");

        modelBuilder.Entity<Payment>()
            .Property(p => p.AmountPaid).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Payment>()
            .Property(p => p.Change).HasColumnType("decimal(18,2)");

        // Prevent accidental cascade-delete chains (e.g. deleting a product shouldn't wipe sale history)
        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.Product)
            .WithMany()
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Cashier)
            .WithMany()
            .OnDelete(DeleteBehavior.Restrict);
    }
}
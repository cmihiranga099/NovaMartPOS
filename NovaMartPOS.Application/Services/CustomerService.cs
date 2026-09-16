using NovaMartPOS.Application.DTOs;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Domain.Entities;

namespace NovaMartPOS.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _repository;

    public CustomerService(ICustomerRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CustomerDto>> GetAllAsync()
    {
        var customers = await _repository.GetAllAsync();
        return customers.Select(MapToDto).ToList();
    }

    public async Task<CustomerDto?> GetByIdAsync(int id)
    {
        var customer = await _repository.GetByIdAsync(id);
        return customer is null ? null : MapToDto(customer);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto)
    {
        var customer = new Customer
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            LoyaltyPoints = 0,
            IsActive = true
        };

        await _repository.AddAsync(customer);
        return MapToDto(customer);
    }

    public async Task<bool> UpdateAsync(int id, UpdateCustomerDto dto)
    {
        var customer = await _repository.GetByIdAsync(id);
        if (customer is null) return false;

        customer.Name = dto.Name;
        customer.Phone = dto.Phone;
        customer.Email = dto.Email;
        customer.IsActive = dto.IsActive;
        customer.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(customer);
        return true;
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var customer = await _repository.GetByIdAsync(id);
        if (customer is null) return (false, "Customer not found.");

        if (await _repository.HasSalesAsync(id))
            return (false, "Cannot delete a customer with sale history. Deactivate instead.");

        await _repository.DeleteAsync(customer);
        return (true, null);
    }

    private static CustomerDto MapToDto(Customer c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Phone = c.Phone,
        Email = c.Email,
        LoyaltyPoints = c.LoyaltyPoints,
        IsActive = c.IsActive
    };
}
using System.Collections.Concurrent;
using MyPuppy.StaffBackend.Models;

namespace MyPuppy.StaffBackend.Data;

public sealed class InMemoryStaffStore
{
    public ConcurrentDictionary<string, Customer> Customers { get; } = new();
    public ConcurrentDictionary<string, Pet> Pets { get; } = new();
    public ConcurrentDictionary<string, Appointment> Appointments { get; } = new();
    public ConcurrentDictionary<string, StaffServiceItem> Services { get; } = new();
    public ConcurrentDictionary<string, Payment> Payments { get; } = new();
    public ConcurrentDictionary<string, Product> Products { get; } = new();

    public InMemoryStaffStore(IConfiguration configuration)
    {
        if (configuration.GetValue("StaffApi:SeedDemoData", true))
        {
            SeedDemoData();
        }
    }

    private void SeedDemoData()
    {
        var customer = new Customer
        {
            Id = "customer-demo",
            Name = "Nguyen Minh Anh",
            Email = "minhanh@example.com",
            Phone = "0901234567",
            Address = "Quan 1, TP. Ho Chi Minh"
        };

        var pet = new Pet
        {
            Id = "pet-demo",
            Name = "Milo",
            Species = "dog",
            Breed = "Poodle",
            Age = 3,
            Weight = 5.2m,
            Owner = customer.Id
        };

        var service = new StaffServiceItem
        {
            Id = "service-demo",
            Name = "Grooming co ban",
            Description = "Tam, say va cat tia long",
            Price = 250000m,
            Duration = 60,
            Category = "grooming"
        };

        var appointment = new Appointment
        {
            Id = "appointment-demo",
            Customer = customer.Id,
            Pet = pet.Id,
            Service = service.Id,
            Date = DateTimeOffset.UtcNow.Date.AddDays(1),
            Time = "09:00",
            Status = "pending",
            Notes = "Khach muon nhan SMS truoc lich hen"
        };

        var payment = new Payment
        {
            Id = "payment-demo",
            Appointment = appointment.Id,
            Amount = service.Price,
            Method = "cash",
            Status = "pending"
        };

        var product = new Product
        {
            Id = "product-demo",
            Name = "Sua tam cho cho",
            Description = "Dung tich 500ml",
            Price = 120000m,
            Category = "accessories",
            Stock = 24,
            Image = "/images/products/dog-shampoo.png"
        };

        customer.Pets.Add(pet.Id);
        pet.MedicalHistory.Add(appointment.Id);

        Customers[customer.Id] = customer;
        Pets[pet.Id] = pet;
        Services[service.Id] = service;
        Appointments[appointment.Id] = appointment;
        Payments[payment.Id] = payment;
        Products[product.Id] = product;
    }
}

using System.Collections.Concurrent;
using MyPuppy.StaffBackend.Data;
using MyPuppy.StaffBackend.Models;

namespace MyPuppy.StaffBackend.Services;

public sealed class StaffCrudService(InMemoryStaffStore store)
{
    private static DateTimeOffset Now() => DateTimeOffset.UtcNow;

    public IReadOnlyCollection<Customer> GetCustomers() => store.Customers.Values.OrderBy(x => x.Name).ToArray();

    public Customer? GetCustomer(string id) => store.Customers.GetValueOrDefault(id);

    public Customer CreateCustomer(Customer customer)
    {
        PrepareNew(customer);
        store.Customers[customer.Id] = customer;
        return customer;
    }

    public Customer? UpdateCustomer(string id, Customer customer)
    {
        if (!store.Customers.ContainsKey(id))
        {
            return null;
        }

        customer.Id = id;
        Touch(customer);
        store.Customers[id] = customer;
        return customer;
    }

    public bool DeleteCustomer(string id) => store.Customers.TryRemove(id, out _);

    public IReadOnlyCollection<Pet> GetPets() => store.Pets.Values.OrderBy(x => x.Name).ToArray();

    public Pet? GetPet(string id) => store.Pets.GetValueOrDefault(id);

    public IReadOnlyCollection<Pet> GetPetsByOwner(string ownerId) =>
        store.Pets.Values.Where(x => x.Owner == ownerId).OrderBy(x => x.Name).ToArray();

    public Pet CreatePet(Pet pet)
    {
        PrepareNew(pet);
        store.Pets[pet.Id] = pet;

        if (store.Customers.TryGetValue(pet.Owner, out var owner) && !owner.Pets.Contains(pet.Id))
        {
            owner.Pets.Add(pet.Id);
            owner.UpdatedAt = Now();
        }

        return pet;
    }

    public Pet? UpdatePet(string id, Pet pet)
    {
        if (!store.Pets.TryGetValue(id, out var oldPet))
        {
            return null;
        }

        pet.Id = id;
        Touch(pet);
        store.Pets[id] = pet;
        MovePetOwnerReference(id, oldPet.Owner, pet.Owner);
        return pet;
    }

    public bool DeletePet(string id)
    {
        if (!store.Pets.TryRemove(id, out var pet))
        {
            return false;
        }

        if (store.Customers.TryGetValue(pet.Owner, out var owner))
        {
            owner.Pets.Remove(id);
            owner.UpdatedAt = Now();
        }

        return true;
    }

    public IReadOnlyCollection<Appointment> GetAppointments() =>
        store.Appointments.Values.OrderBy(x => x.Date).ThenBy(x => x.Time).ToArray();

    public Appointment? GetAppointment(string id) => store.Appointments.GetValueOrDefault(id);

    public IReadOnlyCollection<Appointment> GetAppointmentsByDate(DateOnly date) =>
        store.Appointments.Values
            .Where(x => DateOnly.FromDateTime(x.Date.LocalDateTime) == date)
            .OrderBy(x => x.Time)
            .ToArray();

    public Appointment CreateAppointment(Appointment appointment)
    {
        PrepareNew(appointment);
        if (appointment.Date == default)
        {
            appointment.Date = Now();
        }

        store.Appointments[appointment.Id] = appointment;
        AddAppointmentToPetHistory(appointment.Pet, appointment.Id);
        return appointment;
    }

    public Appointment? UpdateAppointment(string id, Appointment appointment)
    {
        if (!store.Appointments.TryGetValue(id, out var oldAppointment))
        {
            return null;
        }

        appointment.Id = id;
        Touch(appointment);
        store.Appointments[id] = appointment;

        if (oldAppointment.Pet != appointment.Pet)
        {
            RemoveAppointmentFromPetHistory(oldAppointment.Pet, id);
            AddAppointmentToPetHistory(appointment.Pet, id);
        }

        return appointment;
    }

    public bool DeleteAppointment(string id)
    {
        if (!store.Appointments.TryRemove(id, out var appointment))
        {
            return false;
        }

        RemoveAppointmentFromPetHistory(appointment.Pet, id);
        return true;
    }

    public Appointment? ConfirmAppointment(string id) => SetAppointmentStatus(id, "confirmed");

    public Appointment? CompleteAppointment(string id) => SetAppointmentStatus(id, "completed");

    public IReadOnlyCollection<StaffServiceItem> GetServices() =>
        store.Services.Values.OrderBy(x => x.Name).ToArray();

    public StaffServiceItem? GetService(string id) => store.Services.GetValueOrDefault(id);

    public StaffServiceItem CreateService(StaffServiceItem service)
    {
        PrepareNew(service);
        store.Services[service.Id] = service;
        return service;
    }

    public StaffServiceItem? UpdateService(string id, StaffServiceItem service)
    {
        if (!store.Services.ContainsKey(id))
        {
            return null;
        }

        service.Id = id;
        Touch(service);
        store.Services[id] = service;
        return service;
    }

    public bool DeleteService(string id) => store.Services.TryRemove(id, out _);

    public IReadOnlyCollection<Payment> GetPayments() =>
        store.Payments.Values.OrderByDescending(x => x.CreatedAt).ToArray();

    public Payment? GetPayment(string id) => store.Payments.GetValueOrDefault(id);

    public IReadOnlyCollection<Payment> GetPaymentsByAppointment(string appointmentId) =>
        store.Payments.Values.Where(x => x.Appointment == appointmentId).OrderByDescending(x => x.CreatedAt).ToArray();

    public Payment CreatePayment(Payment payment)
    {
        PrepareNew(payment);
        store.Payments[payment.Id] = payment;
        return payment;
    }

    public Payment? UpdatePayment(string id, Payment payment)
    {
        if (!store.Payments.ContainsKey(id))
        {
            return null;
        }

        payment.Id = id;
        Touch(payment);
        store.Payments[id] = payment;
        return payment;
    }

    public bool DeletePayment(string id) => store.Payments.TryRemove(id, out _);

    public Payment? MarkAsPaid(string id)
    {
        if (!store.Payments.TryGetValue(id, out var payment))
        {
            return null;
        }

        payment.Status = "paid";
        payment.PaidAt = Now();
        payment.UpdatedAt = Now();
        return payment;
    }

    public IReadOnlyCollection<Product> GetProducts() => store.Products.Values.OrderBy(x => x.Name).ToArray();

    public Product? GetProduct(string id) => store.Products.GetValueOrDefault(id);

    public Product CreateProduct(Product product)
    {
        PrepareNew(product);
        store.Products[product.Id] = product;
        return product;
    }

    public Product? UpdateProduct(string id, Product product)
    {
        if (!store.Products.ContainsKey(id))
        {
            return null;
        }

        product.Id = id;
        Touch(product);
        store.Products[id] = product;
        return product;
    }

    public bool DeleteProduct(string id) => store.Products.TryRemove(id, out _);

    public Product? UpdateStock(string id, int stock)
    {
        if (!store.Products.TryGetValue(id, out var product))
        {
            return null;
        }

        product.Stock = stock;
        product.UpdatedAt = Now();
        return product;
    }

    private Appointment? SetAppointmentStatus(string id, string status)
    {
        if (!store.Appointments.TryGetValue(id, out var appointment))
        {
            return null;
        }

        appointment.Status = status;
        appointment.UpdatedAt = Now();
        return appointment;
    }

    private void MovePetOwnerReference(string petId, string oldOwnerId, string newOwnerId)
    {
        if (oldOwnerId == newOwnerId)
        {
            return;
        }

        if (store.Customers.TryGetValue(oldOwnerId, out var oldOwner))
        {
            oldOwner.Pets.Remove(petId);
            oldOwner.UpdatedAt = Now();
        }

        if (store.Customers.TryGetValue(newOwnerId, out var newOwner) && !newOwner.Pets.Contains(petId))
        {
            newOwner.Pets.Add(petId);
            newOwner.UpdatedAt = Now();
        }
    }

    private void AddAppointmentToPetHistory(string petId, string appointmentId)
    {
        if (store.Pets.TryGetValue(petId, out var pet) && !pet.MedicalHistory.Contains(appointmentId))
        {
            pet.MedicalHistory.Add(appointmentId);
            pet.UpdatedAt = Now();
        }
    }

    private void RemoveAppointmentFromPetHistory(string petId, string appointmentId)
    {
        if (store.Pets.TryGetValue(petId, out var pet))
        {
            pet.MedicalHistory.Remove(appointmentId);
            pet.UpdatedAt = Now();
        }
    }

    private static void PrepareNew(Customer item)
    {
        item.Id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("N") : item.Id;
        item.CreatedAt = Now();
        item.UpdatedAt = item.CreatedAt;
    }

    private static void PrepareNew(Pet item)
    {
        item.Id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("N") : item.Id;
        item.CreatedAt = Now();
        item.UpdatedAt = item.CreatedAt;
    }

    private static void PrepareNew(Appointment item)
    {
        item.Id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("N") : item.Id;
        item.CreatedAt = Now();
        item.UpdatedAt = item.CreatedAt;
    }

    private static void PrepareNew(StaffServiceItem item)
    {
        item.Id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("N") : item.Id;
        item.CreatedAt = Now();
        item.UpdatedAt = item.CreatedAt;
    }

    private static void PrepareNew(Payment item)
    {
        item.Id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("N") : item.Id;
        item.CreatedAt = Now();
        item.UpdatedAt = item.CreatedAt;
    }

    private static void PrepareNew(Product item)
    {
        item.Id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("N") : item.Id;
        item.CreatedAt = Now();
        item.UpdatedAt = item.CreatedAt;
    }

    private static void Touch(Customer item) => item.UpdatedAt = Now();
    private static void Touch(Pet item) => item.UpdatedAt = Now();
    private static void Touch(Appointment item) => item.UpdatedAt = Now();
    private static void Touch(StaffServiceItem item) => item.UpdatedAt = Now();
    private static void Touch(Payment item) => item.UpdatedAt = Now();
    private static void Touch(Product item) => item.UpdatedAt = Now();
}

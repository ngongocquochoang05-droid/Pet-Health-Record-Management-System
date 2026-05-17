using System.Text.Json;
using MyPuppy.StaffBackend.Data;
using MyPuppy.StaffBackend.Models;
using MyPuppy.StaffBackend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.WriteIndented = true;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<InMemoryStaffStore>();
builder.Services.AddSingleton<StaffCrudService>();

var app = builder.Build();

app.UseCors();

app.MapGet("/", () => Results.Ok(new
{
    name = "MyPuppy Staff API",
    status = "running",
    routes = new[] { "/staff", "/api/staff" }
}));

MapStaffRoutes(app.MapGroup("/staff"));
MapStaffRoutes(app.MapGroup("/api/staff"));

app.Run();

static void MapStaffRoutes(RouteGroupBuilder group)
{
    group.MapGet("/customers", (StaffCrudService service) => Results.Ok(service.GetCustomers()));
    group.MapGet("/customers/{id}", (string id, StaffCrudService service) =>
        service.GetCustomer(id) is { } customer ? Results.Ok(customer) : Results.NotFound(new { message = "Customer not found" }));
    group.MapPost("/customers", (Customer customer, StaffCrudService service) =>
        Results.Created($"/staff/customers/{customer.Id}", service.CreateCustomer(customer)));
    group.MapPut("/customers/{id}", (string id, Customer customer, StaffCrudService service) =>
        service.UpdateCustomer(id, customer) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Customer not found" }));
    group.MapDelete("/customers/{id}", (string id, StaffCrudService service) =>
        service.DeleteCustomer(id) ? Results.Ok(new { message = "Customer deleted" }) : Results.NotFound(new { message = "Customer not found" }));

    group.MapGet("/pets", (StaffCrudService service) => Results.Ok(service.GetPets()));
    group.MapGet("/pets/{id}", (string id, StaffCrudService service) =>
        service.GetPet(id) is { } pet ? Results.Ok(pet) : Results.NotFound(new { message = "Pet not found" }));
    group.MapGet("/customers/{ownerId}/pets", (string ownerId, StaffCrudService service) =>
        Results.Ok(service.GetPetsByOwner(ownerId)));
    group.MapPost("/pets", (Pet pet, StaffCrudService service) =>
        Results.Created($"/staff/pets/{pet.Id}", service.CreatePet(pet)));
    group.MapPut("/pets/{id}", (string id, Pet pet, StaffCrudService service) =>
        service.UpdatePet(id, pet) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Pet not found" }));
    group.MapDelete("/pets/{id}", (string id, StaffCrudService service) =>
        service.DeletePet(id) ? Results.Ok(new { message = "Pet deleted" }) : Results.NotFound(new { message = "Pet not found" }));

    group.MapGet("/appointments", (StaffCrudService service) => Results.Ok(service.GetAppointments()));
    group.MapGet("/appointments/{id}", (string id, StaffCrudService service) =>
        service.GetAppointment(id) is { } appointment ? Results.Ok(appointment) : Results.NotFound(new { message = "Appointment not found" }));
    group.MapGet("/appointments/date/{date}", (DateOnly date, StaffCrudService service) =>
        Results.Ok(service.GetAppointmentsByDate(date)));
    group.MapPost("/appointments", (Appointment appointment, StaffCrudService service) =>
        Results.Created($"/staff/appointments/{appointment.Id}", service.CreateAppointment(appointment)));
    group.MapPut("/appointments/{id}", (string id, Appointment appointment, StaffCrudService service) =>
        service.UpdateAppointment(id, appointment) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Appointment not found" }));
    group.MapDelete("/appointments/{id}", (string id, StaffCrudService service) =>
        service.DeleteAppointment(id) ? Results.Ok(new { message = "Appointment deleted" }) : Results.NotFound(new { message = "Appointment not found" }));
    group.MapPatch("/appointments/{id}/confirm", (string id, StaffCrudService service) =>
        service.ConfirmAppointment(id) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Appointment not found" }));
    group.MapPatch("/appointments/{id}/complete", (string id, StaffCrudService service) =>
        service.CompleteAppointment(id) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Appointment not found" }));

    group.MapGet("/services", (StaffCrudService service) => Results.Ok(service.GetServices()));
    group.MapGet("/services/{id}", (string id, StaffCrudService service) =>
        service.GetService(id) is { } item ? Results.Ok(item) : Results.NotFound(new { message = "Service not found" }));
    group.MapPost("/services", (StaffServiceItem item, StaffCrudService service) =>
        Results.Created($"/staff/services/{item.Id}", service.CreateService(item)));
    group.MapPut("/services/{id}", (string id, StaffServiceItem item, StaffCrudService service) =>
        service.UpdateService(id, item) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Service not found" }));
    group.MapDelete("/services/{id}", (string id, StaffCrudService service) =>
        service.DeleteService(id) ? Results.Ok(new { message = "Service deleted" }) : Results.NotFound(new { message = "Service not found" }));

    group.MapGet("/payments", (StaffCrudService service) => Results.Ok(service.GetPayments()));
    group.MapGet("/payments/{id}", (string id, StaffCrudService service) =>
        service.GetPayment(id) is { } payment ? Results.Ok(payment) : Results.NotFound(new { message = "Payment not found" }));
    group.MapGet("/appointments/{appointmentId}/payments", (string appointmentId, StaffCrudService service) =>
        Results.Ok(service.GetPaymentsByAppointment(appointmentId)));
    group.MapPost("/payments", (Payment payment, StaffCrudService service) =>
        Results.Created($"/staff/payments/{payment.Id}", service.CreatePayment(payment)));
    group.MapPut("/payments/{id}", (string id, Payment payment, StaffCrudService service) =>
        service.UpdatePayment(id, payment) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Payment not found" }));
    group.MapDelete("/payments/{id}", (string id, StaffCrudService service) =>
        service.DeletePayment(id) ? Results.Ok(new { message = "Payment deleted" }) : Results.NotFound(new { message = "Payment not found" }));
    group.MapPatch("/payments/{id}/pay", (string id, StaffCrudService service) =>
        service.MarkAsPaid(id) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Payment not found" }));

    group.MapGet("/products", (StaffCrudService service) => Results.Ok(service.GetProducts()));
    group.MapGet("/products/{id}", (string id, StaffCrudService service) =>
        service.GetProduct(id) is { } product ? Results.Ok(product) : Results.NotFound(new { message = "Product not found" }));
    group.MapPost("/products", (Product product, StaffCrudService service) =>
        Results.Created($"/staff/products/{product.Id}", service.CreateProduct(product)));
    group.MapPut("/products/{id}", (string id, Product product, StaffCrudService service) =>
        service.UpdateProduct(id, product) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Product not found" }));
    group.MapDelete("/products/{id}", (string id, StaffCrudService service) =>
        service.DeleteProduct(id) ? Results.Ok(new { message = "Product deleted" }) : Results.NotFound(new { message = "Product not found" }));
    group.MapPatch("/products/{id}/stock", (string id, StockRequest request, StaffCrudService service) =>
        service.UpdateStock(id, request.Stock) is { } updated ? Results.Ok(updated) : Results.NotFound(new { message = "Product not found" }));
}

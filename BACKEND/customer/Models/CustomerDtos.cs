namespace MyPuppy.Customer.Models;

public record CustomerServiceDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    int Duration,
    int BookingCount,
    int Ranking
);

public record CustomerProductDto(
    int Id,
    string Name,
    string Category,
    string Description,
    decimal Price,
    int Stock
);

public record CustomerProfileDto(
    string Id,
    string FullName,
    string Email,
    string Phone,
    string Address,
    string Gender,
    string Role,
    string Status,
    DateTime? CreatedAt
);

public record UpsertCustomerProfileRequest(
    string ClerkUserId,
    string FullName,
    string Email,
    string? Phone,
    string? Address,
    string? Gender
);

public record CreateBookingRequest(
    string? CustomerId,
    int ServiceId,
    string? PetType,
    string? PetName,
    DateOnly BookingDate,
    TimeOnly BookingTime,
    string? Notes,
    decimal TotalAmount,
    IReadOnlyList<string>? Addons
);

public record CustomerBookingDto(
    int Id,
    string CustomerId,
    int ServiceId,
    string ServiceName,
    string PetName,
    string PetType,
    DateOnly? BookingDate,
    TimeOnly? BookingTime,
    string Status,
    decimal TotalAmount,
    string Notes
);

namespace MyPuppy.Admin.Models;

public record StaffDto(
    string Id,
    string FullName,
    string Email,
    string Phone,
    string Expertise,
    int YearsOfExperience,
    decimal Rating,
    string Status,
    DateTime? CreatedAt
);

public record UpdateStaffRequest(
    string? Expertise,
    int? YearsOfExperience,
    string? Status
);

public record SetStaffAvailabilityRequest(string Status);

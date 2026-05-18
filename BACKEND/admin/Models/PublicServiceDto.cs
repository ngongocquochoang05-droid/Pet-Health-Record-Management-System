namespace MyPuppy.Admin.Models;

/// <summary>
/// DTO public cho frontend customer: dich vu hien len trang Dich vu.
/// </summary>
public record PublicServiceDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    int Duration,
    int BookingCount,
    int Ranking
);

namespace MyPuppy.Admin.Models;

public record OverviewDto(
    int TotalUsers,
    int ActiveUsers,
    int LockedUsers,
    int TotalStaff,
    int ActiveStaff,
    int TotalAppointments,
    int PendingAppointments,
    int CompletedAppointments,
    int CancelledAppointments,
    decimal TotalRevenue
);

public record DailyRevenueDto(string Day, decimal Revenue, int Invoices);
public record MonthlyRevenueDto(string Month, decimal Revenue, int Invoices);
public record RevenueBreakdownDto(decimal ServiceRevenue, decimal ProductRevenue, decimal TotalRevenue);
public record AppointmentStatusBreakdownDto(int Pending, int Completed, int Cancelled, int InProgress);
public record TopStaffDto(string Id, string FullName, string Expertise, int CompletedAppointments, decimal TotalRevenue);
public record TopServiceDto(int Id, string Name, decimal Price, int BookingCount);
public record TopProductDto(int Id, string Name, string Category, int Stock, int TotalSold, decimal TotalRevenue);

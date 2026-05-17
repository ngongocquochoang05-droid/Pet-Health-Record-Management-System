using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Services;

public class ReportService
{
    private readonly AdminRepository _repository;

    public ReportService(AdminRepository repository)
    {
        _repository = repository;
    }

    public async Task<object> GetSummaryAsync()
    {
        var overviewTask = _repository.GetOverviewAsync();
        var dailyTask = _repository.GetRevenueByDayAsync(14);
        var monthlyTask = _repository.GetRevenueByMonthAsync(6);
        var breakdownTask = _repository.GetRevenueBreakdownAsync();
        var appointmentsTask = _repository.GetAppointmentStatusBreakdownAsync(1);
        var topStaffTask = _repository.GetTopStaffByRevenueAsync(5);
        var topServicesTask = _repository.GetTopServicesAsync(5);
        var topProductsTask = _repository.GetTopProductsAsync(5);

        await Task.WhenAll(
            overviewTask, dailyTask, monthlyTask, breakdownTask,
            appointmentsTask, topStaffTask, topServicesTask, topProductsTask);

        var overview = await overviewTask;
        var daily = await dailyTask;
        var monthly = await monthlyTask;
        var breakdown = await breakdownTask;
        var appointments = await appointmentsTask;
        var topStaff = await topStaffTask;
        var topServices = await topServicesTask;
        var topProducts = await topProductsTask;

        decimal cancellationRate = overview.TotalAppointments > 0
            ? (decimal)overview.CancelledAppointments / overview.TotalAppointments
            : 0m;

        return new
        {
            generatedAt = DateTime.UtcNow.ToString("o"),
            overview,
            revenue = new
            {
                total = overview.TotalRevenue,
                service = breakdown.ServiceRevenue,
                product = breakdown.ProductRevenue,
                daily,
                monthly
            },
            appointments = new
            {
                total = overview.TotalAppointments,
                pending = overview.PendingAppointments,
                completed = overview.CompletedAppointments,
                cancelled = overview.CancelledAppointments,
                monthlyBreakdown = appointments,
                cancellationRate
            },
            rankings = new
            {
                topStaff,
                topServices,
                topProducts
            }
        };
    }
}

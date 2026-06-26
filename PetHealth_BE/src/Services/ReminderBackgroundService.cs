using System.Net.Mail;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Services;

public class ReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReminderBackgroundService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(30);

    public ReminderBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<ReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendDueRemindersAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (ObjectDisposedException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Khong gui duoc nhac lich tai kham tu dong.");
                }

                try
                {
                    await Task.Delay(_interval, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Expected when the API is shutting down or restarting.
        }
        catch (ObjectDisposedException) when (stoppingToken.IsCancellationRequested)
        {
            // Expected when the API fails to start and the host disposes services.
        }
    }

    private async Task SendDueRemindersAsync(CancellationToken cancellationToken)
    {
        if (cancellationToken.IsCancellationRequested)
        {
            return;
        }

        using var scope = _serviceProvider.CreateScope();
        var featureRepository = scope.ServiceProvider.GetRequiredService<FeatureRepository>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var createdCount = await featureRepository.CreateAutomaticRemindersFromCompletedAppointmentsAsync();
        if (createdCount > 0)
        {
            _logger.LogInformation("Da tao {Count} nhac lich tai kham tu lich hen hoan thanh.", createdCount);
        }

        var dueDate = DateTime.Today.AddDays(1);
        var reminders = await featureRepository.GetPendingRemindersDueAsync(dueDate);

        foreach (var reminder in reminders)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!MailAddress.TryCreate(reminder.Email, out _))
            {
                _logger.LogWarning(
                    "Bo qua nhac lich {MaNhacLich} vi email khong hop le: {Email}",
                    reminder.MaNhacLich,
                    reminder.Email);
                await featureRepository.MarkReminderFailedAsync(reminder.MaNhacLich);
                continue;
            }

            var content = string.IsNullOrWhiteSpace(reminder.NoiDung)
                ? "PetHealth xin nhac ban ve lich tai kham cua thu cung."
                : reminder.NoiDung;

            try
            {
                await emailService.SendAsync(
                    reminder.Email,
                    "PetHealth - Nhac lich tai kham",
                    $"""
                    <h2>Nhac lich tai kham</h2>
                    <p>PetHealth xin nhac ban ve lich tai kham sap toi.</p>
                    <p>Ngay tai kham: <strong>{reminder.NgayTaiKham}</strong></p>
                    <p>Noi dung: {content}</p>
                    <p>Vui long den dung lich de thu cung duoc cham soc tot nhat.</p>
                    """);

                await featureRepository.MarkReminderSentAsync(reminder.MaNhacLich);
            }
            catch (Exception ex)
            {
                if (ex is EmailConfigurationException)
                {
                    _logger.LogError(ex, "Cau hinh SMTP chua hop le, tam dung gui nhac lich tai kham tu dong.");
                    break;
                }

                _logger.LogError(
                    ex,
                    "Khong gui duoc nhac lich {MaNhacLich} den email {Email}.",
                    reminder.MaNhacLich,
                    reminder.Email);
                await featureRepository.MarkReminderFailedAsync(reminder.MaNhacLich);
            }
        }
    }
}

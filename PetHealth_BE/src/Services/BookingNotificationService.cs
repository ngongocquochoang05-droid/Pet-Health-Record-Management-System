using PetHealth_BE.src.DTOs;

namespace PetHealth_BE.src.Services;

public class BookingNotificationService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<BookingNotificationService> _logger;

    public BookingNotificationService(IEmailService emailService, ILogger<BookingNotificationService> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task SendConfirmedAsync(LichHenDto booking)
    {
        if (string.IsNullOrWhiteSpace(booking.EmailKhachHang))
        {
            return;
        }

        var noteLine = string.IsNullOrWhiteSpace(booking.GhiChu)
            ? string.Empty
            : $"<p>Ghi chú: {booking.GhiChu}</p>";

        await TrySendAsync(booking.EmailKhachHang, "PetHealth - Lịch hẹn đã được xác nhận", $"""
            <h2>Lịch hẹn của bạn đã được xác nhận</h2>
            <p>Xin chào {booking.TenKhachHang},</p>
            <p>PetHealth đã xác nhận lịch hẹn chăm sóc thú cưng của bạn.</p>
            <p>Dịch vụ: <strong>{booking.TenDichVu}</strong></p>
            <p>Thú cưng: <strong>{booking.TenThuCung}</strong></p>
            <p>Ngày hẹn: <strong>{booking.NgayHen}</strong></p>
            <p>Giờ hẹn: <strong>{booking.GioHen}</strong></p>
            {noteLine}
            <p>Cảm ơn bạn đã sử dụng dịch vụ PetHealth.</p>
            """);
    }

    public async Task SendStatusChangedAsync(LichHenDto booking)
    {
        if (string.IsNullOrWhiteSpace(booking.EmailKhachHang)) return;
        var statusText = booking.TrangThai switch
        {
            "Confirmed" => "đã được xác nhận",
            "Completed" => "đã hoàn thành",
            "Cancelled" => "đã bị hủy",
            "NO_SHOW" => "được ghi nhận không đến",
            _ => $"đã chuyển sang trạng thái {booking.TrangThai}"
        };
        await TrySendAsync(booking.EmailKhachHang, $"PetHealth - Lịch hẹn {statusText}",
            $"<h2>Cập nhật lịch hẹn</h2><p>Xin chào {booking.TenKhachHang},</p><p>Lịch hẹn #{booking.MaLichHen} của {booking.TenThuCung} {statusText}.</p><p>Ngày giờ: <strong>{booking.NgayHen} {booking.GioHen}</strong></p>");
    }

    private async Task TrySendAsync(string email, string subject, string body)
    {
        try
        {
            await _emailService.SendAsync(email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không gửi được email trạng thái lịch hẹn đến {Email}.", email);
        }
    }
}

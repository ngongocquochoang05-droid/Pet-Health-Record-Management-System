using Dapper;
using PetHealth_BE.src.DTOs;

namespace PetHealth_BE.src.Repositories;

public class NotificationRepository
{
    private readonly SqlConnectionFactory _connectionFactory;
    public NotificationRepository(SqlConnectionFactory connectionFactory) => _connectionFactory = connectionFactory;

    public async Task CreateAsync(string userId, string title, string content, string? path = null)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return;
        }

        const string sql = """
            INSERT INTO ThongBaoNguoiDung (MaNguoiDung, TieuDe, NoiDung, DuongDan)
            VALUES (@UserId, @Title, @Content, @Path);
            """;
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            Title = title,
            Content = content,
            Path = path
        });
    }

    public async Task CreateForRoleAsync(string role, string title, string content, string? path = null)
    {
        const string sql = """
            INSERT INTO ThongBaoNguoiDung (MaNguoiDung, TieuDe, NoiDung, DuongDan)
            SELECT MaNguoiDung, @Title, @Content, @Path
            FROM NguoiDung
            WHERE VaiTro = @Role
              AND TrangThaiHoatDong = 1;
            """;
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Role = role,
            Title = title,
            Content = content,
            Path = path
        });
    }

    public async Task NotifyBookingCreatedAsync(LichHenDto booking)
    {
        var content = $"Lịch hẹn #{booking.MaLichHen} của {booking.TenKhachHang} cho thú cưng {booking.TenThuCung} đang chờ xử lý.";
        await CreateForRoleAsync("Admin", "Có lịch hẹn mới", content, "/admin");
        if (!string.IsNullOrWhiteSpace(booking.MaNhanVien))
        {
            await CreateAsync(booking.MaNhanVien, "Bạn có lịch hẹn mới", $"Bạn được phân công lịch hẹn #{booking.MaLichHen} vào {booking.NgayHen} {booking.GioHen}.", "/staff/work");
        }
    }

    public async Task NotifyBookingStatusChangedAsync(LichHenDto booking)
    {
        var content = $"Lịch hẹn #{booking.MaLichHen} của {booking.TenKhachHang} đã chuyển sang trạng thái {booking.TrangThai}.";
        await CreateForRoleAsync("Admin", "Trạng thái lịch hẹn thay đổi", content, "/admin");
        if (!string.IsNullOrWhiteSpace(booking.MaNhanVien))
        {
            await CreateAsync(booking.MaNhanVien, "Trạng thái lịch được phân công thay đổi", $"Lịch hẹn #{booking.MaLichHen} hiện là {booking.TrangThai}.", "/staff/work");
        }
    }

    public async Task NotifyStaffAssignedAsync(LichHenDto booking)
    {
        if (string.IsNullOrWhiteSpace(booking.MaNhanVien))
        {
            return;
        }

        await CreateAsync(booking.MaNhanVien, "Bạn vừa được phân công lịch hẹn", $"Lịch hẹn #{booking.MaLichHen} của {booking.TenThuCung} vào {booking.NgayHen} {booking.GioHen}.", "/staff/work");
    }

    public async Task<IEnumerable<NotificationDto>> GetAsync(string userId)
    {
        const string sql = """
            SELECT MaThongBao, TieuDe, NoiDung, DuongDan, DaDoc,
                   CONVERT(varchar(33), NgayTao, 126) AS NgayTao
            FROM ThongBaoNguoiDung
            WHERE MaNguoiDung = @UserId
            ORDER BY DaDoc, NgayTao DESC;
            """;
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<NotificationDto>(sql, new { UserId = userId });
    }

    public async Task<bool> MarkReadAsync(int id, string userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(
            "UPDATE ThongBaoNguoiDung SET DaDoc = 1 WHERE MaThongBao = @Id AND MaNguoiDung = @UserId;",
            new { Id = id, UserId = userId }) > 0;
    }

    public async Task MarkAllReadAsync(string userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync("UPDATE ThongBaoNguoiDung SET DaDoc = 1 WHERE MaNguoiDung = @UserId;", new { UserId = userId });
    }
}

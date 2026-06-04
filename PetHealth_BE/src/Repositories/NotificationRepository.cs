using Dapper;
using PetHealth_BE.src.DTOs;

namespace PetHealth_BE.src.Repositories;

public class NotificationRepository
{
    private readonly SqlConnectionFactory _connectionFactory;
    public NotificationRepository(SqlConnectionFactory connectionFactory) => _connectionFactory = connectionFactory;

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

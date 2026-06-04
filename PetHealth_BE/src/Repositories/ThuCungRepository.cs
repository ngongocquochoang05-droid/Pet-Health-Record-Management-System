using Dapper;
using PetHealth_BE.src.Models;

namespace PetHealth_BE.src.Repositories;

public class ThuCungRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public ThuCungRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<ThuCung>> GetByOwnerIdAsync(string maNguoiDung)
    {
        const string sql = """
            SELECT
                MaThuCung,
                MaChuNhan AS MaNguoiDung,
                TenThuCung,
                GiongLoai AS Giong,
                GiongLoai AS LoaiThuCung,
                NULL AS GioiTinh,
                NgaySinh,
                CanNang,
                GhiChu
            FROM ThuCung
            WHERE MaChuNhan = @MaNguoiDung
            ORDER BY MaThuCung DESC;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<ThuCung>(sql, new { MaNguoiDung = maNguoiDung });
    }

    public async Task<ThuCung?> GetByIdAsync(int maThuCung)
    {
        const string sql = """
            SELECT
                MaThuCung,
                MaChuNhan AS MaNguoiDung,
                TenThuCung,
                GiongLoai AS Giong,
                GiongLoai AS LoaiThuCung,
                NULL AS GioiTinh,
                NgaySinh,
                CanNang,
                GhiChu
            FROM ThuCung
            WHERE MaThuCung = @MaThuCung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<ThuCung>(sql, new { MaThuCung = maThuCung });
    }

    public async Task<int> CreateAsync(ThuCung pet)
    {
        const string sql = """
            INSERT INTO ThuCung (MaChuNhan, TenThuCung, GiongLoai, NgaySinh, CanNang, GhiChu)
            OUTPUT INSERTED.MaThuCung
            VALUES (@MaNguoiDung, @TenThuCung, @Giong, @NgaySinh, @CanNang, @GhiChu);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, pet);
    }

    public async Task<bool> UpdateAsync(int maThuCung, string maNguoiDung, ThuCung pet)
    {
        const string sql = """
            UPDATE ThuCung
            SET TenThuCung = @TenThuCung,
                GiongLoai = @Giong,
                NgaySinh = @NgaySinh,
                CanNang = @CanNang,
                GhiChu = @GhiChu
            WHERE MaThuCung = @MaThuCung
              AND MaChuNhan = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaThuCung = maThuCung,
            MaNguoiDung = maNguoiDung,
            pet.TenThuCung,
            pet.Giong,
            pet.NgaySinh,
            pet.CanNang,
            pet.GhiChu
        });

        return affected > 0;
    }

    public async Task<bool> HasAppointmentsAsync(int maThuCung)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM LichHen
            WHERE MaThuCung = @MaThuCung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var count = await connection.ExecuteScalarAsync<int>(sql, new { MaThuCung = maThuCung });
        return count > 0;
    }

    public async Task<bool> DeleteAsync(int maThuCung, string maNguoiDung)
    {
        const string sql = """
            DELETE FROM ThuCung
            WHERE MaThuCung = @MaThuCung
              AND MaChuNhan = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new { MaThuCung = maThuCung, MaNguoiDung = maNguoiDung });
        return affected > 0;
    }
}


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
                GioiTinh,
                NgaySinh,
                CanNang,
                GhiChu,
                TrangThaiHoatDong
            FROM ThuCung
            WHERE MaChuNhan = @MaNguoiDung
              AND TrangThaiHoatDong = 1
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
                GioiTinh,
                NgaySinh,
                CanNang,
                GhiChu,
                TrangThaiHoatDong
            FROM ThuCung
            WHERE MaThuCung = @MaThuCung
              AND TrangThaiHoatDong = 1;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<ThuCung>(sql, new { MaThuCung = maThuCung });
    }

    public async Task<int> CreateAsync(ThuCung pet)
    {
        const string sql = """
            INSERT INTO ThuCung (MaChuNhan, TenThuCung, GiongLoai, GioiTinh, NgaySinh, CanNang, GhiChu, TrangThaiHoatDong)
            OUTPUT INSERTED.MaThuCung
            VALUES (@MaNguoiDung, @TenThuCung, @Giong, @GioiTinh, @NgaySinh, @CanNang, @GhiChu, 1);
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
                GioiTinh = @GioiTinh,
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
            pet.GioiTinh,
            pet.NgaySinh,
            pet.CanNang,
            pet.GhiChu
        });

        return affected > 0;
    }

    public async Task<bool> DeleteAsync(int maThuCung, string maNguoiDung)
    {
        const string sql = """
            UPDATE ThuCung
            SET TrangThaiHoatDong = 0
            WHERE MaThuCung = @MaThuCung
              AND MaChuNhan = @MaNguoiDung
              AND TrangThaiHoatDong = 1;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new { MaThuCung = maThuCung, MaNguoiDung = maNguoiDung });
        return affected > 0;
    }
}


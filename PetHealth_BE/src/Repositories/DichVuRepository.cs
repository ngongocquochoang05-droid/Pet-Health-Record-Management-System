using Dapper;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;

namespace PetHealth_BE.src.Repositories;

public class DichVuRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public DichVuRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<DichVu>> GetAllAsync()
    {
        const string sql = """
            SELECT MaDichVu, TenDichVu, MoTa, GiaTien, ThoiGianThucHien, AnhDichVuUrl, LoaiThuCung, TrangThaiHoatDong
            FROM DichVu
            WHERE TrangThaiHoatDong = 1
            ORDER BY MaDichVu;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<DichVu>(sql);
    }

    public async Task<DichVu?> GetByIdAsync(int maDichVu)
    {
        const string sql = """
            SELECT MaDichVu, TenDichVu, MoTa, GiaTien, ThoiGianThucHien, AnhDichVuUrl, LoaiThuCung, TrangThaiHoatDong
            FROM DichVu
            WHERE MaDichVu = @MaDichVu;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<DichVu>(sql, new { MaDichVu = maDichVu });
    }

    public async Task<int> CreateAsync(ServiceUpsertDto service)
    {
        const string sql = """
            INSERT INTO DichVu (TenDichVu, MoTa, GiaTien, ThoiGianThucHien, AnhDichVuUrl, LoaiThuCung, TrangThaiHoatDong)
            OUTPUT INSERTED.MaDichVu
            VALUES (@TenDichVu, @MoTa, @GiaTien, @ThoiGianThucHien, @AnhDichVuUrl, @LoaiThuCung, @TrangThaiHoatDong);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, service);
    }

    public async Task<bool> UpdateAsync(int maDichVu, ServiceUpsertDto service)
    {
        const string sql = """
            UPDATE DichVu
            SET TenDichVu = @TenDichVu,
                MoTa = @MoTa,
                GiaTien = @GiaTien,
                ThoiGianThucHien = @ThoiGianThucHien,
                AnhDichVuUrl = @AnhDichVuUrl,
                LoaiThuCung = @LoaiThuCung,
                TrangThaiHoatDong = @TrangThaiHoatDong
            WHERE MaDichVu = @MaDichVu;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaDichVu = maDichVu,
            service.TenDichVu,
            service.MoTa,
            service.GiaTien,
            service.ThoiGianThucHien,
            service.AnhDichVuUrl,
            service.LoaiThuCung,
            service.TrangThaiHoatDong
        });
        return affected > 0;
    }

    public async Task<IEnumerable<DichVuDto>> GetCatalogAsync(bool includeInactive = false)
    {
        var sql = """
            SELECT
                dv.MaDichVu,
                dv.TenDichVu,
                dv.MoTa,
                dv.GiaTien,
                dv.ThoiGianThucHien,
                dv.AnhDichVuUrl,
                dv.LoaiThuCung,
                dv.TrangThaiHoatDong,
                COUNT(DISTINCT lh.MaLichHen) AS SoLanDat,
                CAST(AVG(CAST(dg.SoSao AS decimal(18,2))) AS decimal(18,2)) AS DiemTrungBinh,
                COUNT(DISTINCT dg.MaDanhGia) AS SoDanhGia
            FROM DichVu dv
            LEFT JOIN LichHen lh ON lh.MaDichVu = dv.MaDichVu
            LEFT JOIN DanhGiaDichVu dg ON dg.MaDichVu = dv.MaDichVu
            """;

        if (!includeInactive)
        {
            sql += " WHERE dv.TrangThaiHoatDong = 1";
        }

        sql += """
             GROUP BY dv.MaDichVu, dv.TenDichVu, dv.MoTa, dv.GiaTien, dv.ThoiGianThucHien, dv.AnhDichVuUrl, dv.LoaiThuCung, dv.TrangThaiHoatDong
             ORDER BY dv.MaDichVu;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<DichVuDto>(sql);
    }

    public async Task<bool> DeleteAsync(int maDichVu)
    {
        const string sql = "DELETE FROM DichVu WHERE MaDichVu = @MaDichVu;";

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new { MaDichVu = maDichVu });
        return affected > 0;
    }
}

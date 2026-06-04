using Dapper;
using PetHealth_BE.src.DTOs;

namespace PetHealth_BE.src.Repositories;

public class ClinicalRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public ClinicalRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<MedicalRecordDto>> GetAsync(string userId, bool isAdmin, bool isStaff, int? maThuCung)
    {
        const string sql = """
            SELECT hs.MaHoSo, hs.MaLichHen, hs.MaThuCung, tc.TenThuCung,
                   hs.MaNhanVien, nv.HoVaTen AS TenNhanVien, hs.ChanDoan,
                   hs.DieuTri, hs.Thuoc, hs.TiemChung, hs.GhiChu,
                   CONVERT(varchar(33), hs.NgayCapNhat, 126) AS NgayCapNhat
            FROM HoSoBenhAn hs
            INNER JOIN ThuCung tc ON tc.MaThuCung = hs.MaThuCung
            LEFT JOIN NguoiDung nv ON nv.MaNguoiDung = hs.MaNhanVien
            LEFT JOIN LichHen lh ON lh.MaLichHen = hs.MaLichHen
            WHERE (@MaThuCung IS NULL OR hs.MaThuCung = @MaThuCung)
              AND (@IsAdmin = 1 OR (@IsStaff = 1 AND lh.MaNhanVien = @UserId) OR tc.MaChuNhan = @UserId)
            ORDER BY hs.NgayCapNhat DESC;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<MedicalRecordDto>(sql, new
        {
            UserId = userId,
            IsAdmin = isAdmin,
            IsStaff = isStaff,
            MaThuCung = maThuCung
        });
    }

    public async Task<int?> UpsertAsync(UpsertMedicalRecordDto request, string staffId, bool isAdmin)
    {
        const string sql = """
            IF EXISTS (
                SELECT 1 FROM LichHen
                WHERE MaLichHen = @MaLichHen AND MaThuCung = @MaThuCung
                  AND (@IsAdmin = 1 OR MaNhanVien = @StaffId)
            )
            BEGIN
                IF EXISTS (SELECT 1 FROM HoSoBenhAn WHERE MaLichHen = @MaLichHen)
                BEGIN
                    UPDATE HoSoBenhAn
                    SET ChanDoan = @ChanDoan, DieuTri = @DieuTri, Thuoc = @Thuoc,
                        TiemChung = @TiemChung, GhiChu = @GhiChu,
                        MaNhanVien = @StaffId, NgayCapNhat = GETDATE()
                    WHERE MaLichHen = @MaLichHen;
                    SELECT MaHoSo FROM HoSoBenhAn WHERE MaLichHen = @MaLichHen;
                END
                ELSE
                BEGIN
                    INSERT INTO HoSoBenhAn
                        (MaLichHen, MaThuCung, MaNhanVien, ChanDoan, DieuTri, Thuoc, TiemChung, GhiChu, NgayCapNhat)
                    OUTPUT INSERTED.MaHoSo
                    VALUES
                        (@MaLichHen, @MaThuCung, @StaffId, @ChanDoan, @DieuTri, @Thuoc, @TiemChung, @GhiChu, GETDATE());
                END
            END
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int?>(sql, new
        {
            request.MaLichHen,
            request.MaThuCung,
            request.ChanDoan,
            request.DieuTri,
            request.Thuoc,
            request.TiemChung,
            request.GhiChu,
            StaffId = staffId,
            IsAdmin = isAdmin
        });
    }
}

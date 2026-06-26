using System.Data;
using Dapper;
using PetHealth_BE.src.DTOs;

namespace PetHealth_BE.src.Repositories;

public class FeatureRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public FeatureRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<HoaDonDto>> GetInvoicesAsync(string? maKhachHang, string? maNhanVien = null)
    {
        var sql = """
            SELECT
                hd.MaHoaDon,
                hd.MaLichHen,
                hd.MaKhachHang AS MaKhachHang,
                nd.HoVaTen AS TenKhachHang,
                ISNULL(hd.TongTien, 0) AS TongTien,
                hd.PhuongThucThanhToan,
                hd.TrangThaiThanhToan,
                hd.MaNhanVienXacNhan,
                CONVERT(varchar(33), hd.NgayThanhToan, 126) AS NgayThanhToan
            FROM HoaDon hd
            LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = hd.MaKhachHang
            """;

        if (!string.IsNullOrWhiteSpace(maKhachHang))
        {
            sql += " WHERE hd.MaKhachHang = @MaKhachHang";
        }
        else if (!string.IsNullOrWhiteSpace(maNhanVien))
        {
            sql += " WHERE hd.MaNhanVienXacNhan = @MaNhanVien";
        }

        sql += " ORDER BY hd.MaHoaDon DESC;";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<HoaDonDto>(sql, new { MaKhachHang = maKhachHang, MaNhanVien = maNhanVien });
    }

    public async Task<int?> UpsertInvoiceAsync(UpsertHoaDonDto request, string maNhanVien, bool isAdmin)
    {
        const string sql = """
            IF EXISTS
            (
                SELECT 1
                FROM LichHen lh
                WHERE lh.MaLichHen = @MaLichHen
                  AND (@IsAdmin = 1 OR lh.MaNhanVien = @MaNhanVien)
            )
            BEGIN
                IF EXISTS (SELECT 1 FROM HoaDon WHERE MaLichHen = @MaLichHen)
                BEGIN
                    UPDATE HoaDon
                    SET TongTien = @TongTien,
                        PhuongThucThanhToan = @PhuongThucThanhToan,
                        TrangThaiThanhToan = @TrangThaiThanhToan,
                        MaNhanVienXacNhan = @MaNhanVien,
                        NgayThanhToan = CASE WHEN @TrangThaiThanhToan = 'Paid' THEN GETDATE() ELSE NgayThanhToan END
                    WHERE MaLichHen = @MaLichHen;
                    SELECT MaHoaDon FROM HoaDon WHERE MaLichHen = @MaLichHen;
                END
                ELSE
                BEGIN
                    INSERT INTO HoaDon (MaLichHen, MaKhachHang, TongTien, PhuongThucThanhToan, TrangThaiThanhToan, MaNhanVienXacNhan, NgayThanhToan)
                    OUTPUT INSERTED.MaHoaDon
                    SELECT lh.MaLichHen, lh.MaKhachHang, @TongTien, @PhuongThucThanhToan, @TrangThaiThanhToan, @MaNhanVien,
                           CASE WHEN @TrangThaiThanhToan = 'Paid' THEN GETDATE() ELSE NULL END
                    FROM LichHen lh
                    WHERE lh.MaLichHen = @MaLichHen;
                END
            END
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int?>(sql, new
        {
            request.MaLichHen,
            request.TongTien,
            request.PhuongThucThanhToan,
            request.TrangThaiThanhToan,
            MaNhanVien = maNhanVien,
            IsAdmin = isAdmin
        });
    }

    public async Task<IEnumerable<CaLamViecDto>> GetShiftsAsync(string? maNhanVien)
    {
        var sql = """
            SELECT
                cl.MaCaLam,
                cl.MaNhanVien AS MaNhanVien,
                nd.HoVaTen AS TenNhanVien,
                CONVERT(varchar(10), cl.NgayLam, 23) AS NgayLam,
                LEFT(CONVERT(varchar(8), cl.GioBatDau, 108), 5) AS GioBatDau,
                LEFT(CONVERT(varchar(8), cl.GioKetThuc, 108), 5) AS GioKetThuc,
                cl.TrangThai,
                cl.GhiChu
            FROM CaLamViec cl
            LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = cl.MaNhanVien
            """;

        if (!string.IsNullOrWhiteSpace(maNhanVien))
        {
            sql += " WHERE cl.MaNhanVien = @MaNhanVien";
        }

        sql += " ORDER BY cl.NgayLam DESC, cl.GioBatDau;";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<CaLamViecDto>(sql, new { MaNhanVien = maNhanVien });
    }

    public async Task<int> CreateShiftAsync(UpsertCaLamViecDto request)
    {
        const string sql = """
            INSERT INTO CaLamViec (MaNhanVien, NgayLam, GioBatDau, GioKetThuc, TrangThai, GhiChu)
            OUTPUT INSERTED.MaCaLam
            VALUES (@MaNhanVien, @NgayLam, @GioBatDau, @GioKetThuc, @TrangThai, @GhiChu);
            """;

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        var id = await connection.ExecuteScalarAsync<int>(sql, request, transaction);
        await SynchronizeShiftAssignmentsAsync(connection, transaction);
        transaction.Commit();
        return id;
    }

    public async Task<bool> UpdateShiftAsync(int maCaLam, UpsertCaLamViecDto request)
    {
        const string sql = """
            UPDATE CaLamViec
            SET MaNhanVien = @MaNhanVien,
                NgayLam = @NgayLam,
                GioBatDau = @GioBatDau,
                GioKetThuc = @GioKetThuc,
                TrangThai = @TrangThai,
                GhiChu = @GhiChu
            WHERE MaCaLam = @MaCaLam;
            """;

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaCaLam = maCaLam,
            request.MaNhanVien,
            request.NgayLam,
            request.GioBatDau,
            request.GioKetThuc,
            request.TrangThai,
            request.GhiChu
        }, transaction);

        if (affected > 0)
        {
            await SynchronizeShiftAssignmentsAsync(connection, transaction);
        }

        transaction.Commit();
        return affected > 0;
    }

    public async Task<bool> DeleteShiftAsync(int maCaLam)
    {
        const string sql = "DELETE FROM CaLamViec WHERE MaCaLam = @MaCaLam;";
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        var affected = await connection.ExecuteAsync(sql, new { MaCaLam = maCaLam }, transaction);

        if (affected > 0)
        {
            await SynchronizeShiftAssignmentsAsync(connection, transaction);
        }

        transaction.Commit();
        return affected > 0;
    }

    public async Task SynchronizeShiftAssignmentsAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        await SynchronizeShiftAssignmentsAsync(connection, transaction);
        transaction.Commit();
    }

    private static async Task SynchronizeShiftAssignmentsAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = """
            UPDATE lh
            SET MaNhanVien = replacement.MaNhanVien
            FROM LichHen lh
            OUTER APPLY
            (
                SELECT TOP 1 cl.MaNhanVien
                FROM CaLamViec cl
                INNER JOIN NguoiDung nd ON nd.MaNguoiDung = cl.MaNhanVien
                INNER JOIN HoSoNhanVien hs ON hs.MaNhanVien = cl.MaNhanVien
                OUTER APPLY
                (
                    SELECT COUNT(1) AS AssignedCount
                    FROM LichHen assigned
                    WHERE assigned.MaNhanVien = cl.MaNhanVien
                      AND assigned.NgayHen = lh.NgayHen
                      AND assigned.GioBatDau = lh.GioBatDau
                      AND assigned.TrangThai IN ('Pending', 'Confirmed')
                ) staffLoad
                WHERE cl.NgayLam = lh.NgayHen
                  AND cl.GioBatDau <= lh.GioBatDau
                  AND cl.GioKetThuc >= ISNULL(lh.GioKetThuc, lh.GioBatDau)
                  AND cl.TrangThai = 'Available'
                  AND nd.VaiTro = 'Staff'
                  AND nd.TrangThaiHoatDong = 1
                  AND ISNULL(hs.SanSangLamViec, 0) = 1
                  AND ISNULL(staffLoad.AssignedCount, 0) < 3
                ORDER BY
                    CASE WHEN cl.MaNhanVien = lh.MaNhanVien THEN 0 ELSE 1 END,
                    ISNULL(staffLoad.AssignedCount, 0),
                    cl.MaCaLam
            ) replacement
            WHERE lh.TrangThai IN ('Pending', 'Confirmed')
              AND NOT EXISTS
              (
                  SELECT 1
                  FROM CaLamViec currentShift
                  INNER JOIN NguoiDung currentUser ON currentUser.MaNguoiDung = currentShift.MaNhanVien
                  INNER JOIN HoSoNhanVien currentProfile ON currentProfile.MaNhanVien = currentShift.MaNhanVien
                  WHERE currentShift.MaNhanVien = lh.MaNhanVien
                    AND currentShift.NgayLam = lh.NgayHen
                    AND currentShift.GioBatDau <= lh.GioBatDau
                    AND currentShift.GioKetThuc >= ISNULL(lh.GioKetThuc, lh.GioBatDau)
                    AND currentShift.TrangThai = 'Available'
                    AND currentUser.VaiTro = 'Staff'
                    AND currentUser.TrangThaiHoatDong = 1
                    AND ISNULL(currentProfile.SanSangLamViec, 0) = 1
              );
            """;

        await connection.ExecuteAsync(sql, transaction: transaction);
    }

    public async Task<IEnumerable<CustomerUsageDto>> GetCustomerUsageAsync()
    {
        const string sql = """
            SELECT
                nd.MaNguoiDung AS MaKhachHang,
                nd.HoVaTen,
                nd.Email,
                ISNULL(nd.LoginCount, 0) AS LoginCount,
                CONVERT(varchar(33), nd.LastLoginAt, 126) AS LastLoginAt,
                COUNT(lh.MaLichHen) AS SoLanDat,
                SUM(CASE WHEN lh.TrangThai = 'Completed' THEN 1 ELSE 0 END) AS SoLanHoanThanh,
                STRING_AGG(CONVERT(nvarchar(max), dv.TenDichVu), N', ') AS DichVuDaDung
            FROM NguoiDung nd
            LEFT JOIN LichHen lh ON lh.MaKhachHang = nd.MaNguoiDung
            LEFT JOIN DichVu dv ON dv.MaDichVu = lh.MaDichVu
            WHERE nd.VaiTro = 'Customer'
            GROUP BY nd.MaNguoiDung, nd.HoVaTen, nd.Email, nd.LoginCount, nd.LastLoginAt
            ORDER BY nd.HoVaTen;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<CustomerUsageDto>(sql);
    }

    public async Task<PetQrDto?> IssuePetQrAsync(int maThuCung)
    {
        const string sql = """
            DECLARE @MaQr nvarchar(100) = COALESCE((SELECT MaQr FROM ThuCung WHERE MaThuCung = @MaThuCung), CONCAT(N'PET-', @MaThuCung, N'-', LEFT(CONVERT(nvarchar(36), NEWID()), 8)));
            DECLARE @QrUrl nvarchar(1000) = CONCAT(N'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=', @MaQr);

            UPDATE ThuCung
            SET MaQr = @MaQr,
                QrCodeUrl = @QrUrl,
                NgayCapQr = COALESCE(NgayCapQr, GETDATE())
            WHERE MaThuCung = @MaThuCung;

            SELECT
                tc.MaThuCung,
                tc.TenThuCung,
                nd.HoVaTen AS TenChuNuoi,
                nd.Email AS EmailChuNuoi,
                tc.MaQr,
                tc.QrCodeUrl,
                CONVERT(varchar(33), tc.NgayCapQr, 126) AS NgayCapQr
            FROM ThuCung tc
            INNER JOIN NguoiDung nd ON nd.MaNguoiDung = tc.MaChuNhan
            WHERE tc.MaThuCung = @MaThuCung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<PetQrDto>(sql, new { MaThuCung = maThuCung });
    }

    public async Task<IEnumerable<PetHistoryDto>> GetPetHistoryAsync(int? maThuCung, string? maQr)
    {
        const string sql = """
            SELECT
                lh.MaLichHen,
                tc.MaThuCung,
                tc.TenThuCung,
                services.TenDichVu,
                CONVERT(varchar(10), lh.NgayHen, 23) AS NgayHen,
                LEFT(CONVERT(varchar(8), lh.GioBatDau, 108), 5) AS GioHen,
                lh.TrangThai,
                lh.GhiChu,
                hs.MaHoSo,
                hs.ChanDoan,
                hs.DieuTri,
                hs.Thuoc,
                hs.TiemChung,
                hs.GhiChu AS GhiChuBenhAn,
                CONVERT(varchar(33), hs.NgayCapNhat, 126) AS NgayCapNhatBenhAn,
                nv.HoVaTen AS TenNhanVienCapNhat
            FROM LichHen lh
            INNER JOIN ThuCung tc ON tc.MaThuCung = lh.MaThuCung
            LEFT JOIN HoSoBenhAn hs ON hs.MaLichHen = lh.MaLichHen
            LEFT JOIN NguoiDung nv ON nv.MaNguoiDung = hs.MaNhanVien
            OUTER APPLY (
                SELECT STRING_AGG(dv.TenDichVu, N', ') WITHIN GROUP (ORDER BY dv.MaDichVu) AS TenDichVu
                FROM LichHenDichVu lhdv
                INNER JOIN DichVu dv ON dv.MaDichVu = lhdv.MaDichVu
                WHERE lhdv.MaLichHen = lh.MaLichHen
            ) services
            WHERE (@MaThuCung IS NULL OR tc.MaThuCung = @MaThuCung)
              AND (@MaQr IS NULL OR tc.MaQr = @MaQr)
            ORDER BY lh.NgayHen DESC, lh.GioBatDau DESC;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<PetHistoryDto>(sql, new { MaThuCung = maThuCung, MaQr = maQr });
    }

    public async Task<int> CreateReminderAsync(CreateReminderDto request)
    {
        const string sql = """
            INSERT INTO NhacLichTaiKham (MaLichHen, MaKhachHang, Email, NgayTaiKham, NoiDung, TrangThai)
            OUTPUT INSERTED.MaNhacLich
            SELECT lh.MaLichHen, lh.MaKhachHang, nd.Email, @NgayTaiKham, @NoiDung, N'Pending'
            FROM LichHen lh
            INNER JOIN NguoiDung nd ON nd.MaNguoiDung = lh.MaKhachHang
            WHERE lh.MaLichHen = @MaLichHen;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, request);
    }

    public async Task<IEnumerable<ReminderDto>> GetRemindersAsync()
    {
        const string sql = """
            SELECT MaNhacLich, MaLichHen, MaKhachHang AS MaKhachHang, Email,
                   CONVERT(varchar(10), NgayTaiKham, 23) AS NgayTaiKham,
                   NoiDung, TrangThai, CONVERT(varchar(33), NgayTao, 126) AS NgayTao,
                   CONVERT(varchar(33), NgayGui, 126) AS NgayGui
            FROM NhacLichTaiKham
            ORDER BY MaNhacLich DESC;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<ReminderDto>(sql);
    }

    public async Task<ReminderDto?> GetReminderByIdAsync(int maNhacLich)
    {
        const string sql = """
            SELECT MaNhacLich, MaLichHen, MaKhachHang AS MaKhachHang, Email,
                   CONVERT(varchar(10), NgayTaiKham, 23) AS NgayTaiKham,
                   NoiDung, TrangThai, CONVERT(varchar(33), NgayTao, 126) AS NgayTao,
                   CONVERT(varchar(33), NgayGui, 126) AS NgayGui
            FROM NhacLichTaiKham
            WHERE MaNhacLich = @MaNhacLich;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<ReminderDto>(sql, new { MaNhacLich = maNhacLich });
    }

    public async Task<IEnumerable<ReminderDto>> GetPendingRemindersDueAsync(DateTime dueDate)
    {
        const string sql = """
            SELECT MaNhacLich, MaLichHen, MaKhachHang AS MaKhachHang, Email,
                   CONVERT(varchar(10), NgayTaiKham, 23) AS NgayTaiKham,
                   NoiDung, TrangThai, CONVERT(varchar(33), NgayTao, 126) AS NgayTao,
                   CONVERT(varchar(33), NgayGui, 126) AS NgayGui
            FROM NhacLichTaiKham
            WHERE TrangThai = N'Pending'
              AND NgayTaiKham <= @DueDate
            ORDER BY NgayTaiKham, MaNhacLich;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<ReminderDto>(sql, new { DueDate = dueDate.Date });
    }

    public async Task<int> CreateAutomaticRemindersFromCompletedAppointmentsAsync()
    {
        const string sql = """
            DECLARE @AppointmentServices TABLE
            (
                MaLichHen int PRIMARY KEY,
                CoDichVuKham bit NOT NULL
            );

            INSERT INTO @AppointmentServices (MaLichHen, CoDichVuKham)
            SELECT
                lhdv.MaLichHen,
                CONVERT(bit, MAX(CASE
                    WHEN LOWER(dv.TenDichVu) COLLATE Latin1_General_CI_AI LIKE N'%kham%' THEN 1
                    ELSE 0
                END))
            FROM LichHenDichVu lhdv
            INNER JOIN DichVu dv ON dv.MaDichVu = lhdv.MaDichVu
            GROUP BY lhdv.MaLichHen;

            INSERT INTO NhacLichTaiKham (MaLichHen, MaKhachHang, Email, NgayTaiKham, NoiDung, TrangThai)
            SELECT
                lh.MaLichHen,
                lh.MaKhachHang,
                nd.Email,
                CASE
                    WHEN services.CoDichVuKham = 1
                         AND tc.NgaySinh IS NOT NULL
                         AND DATEADD(year, 1, tc.NgaySinh) > lh.NgayHen
                        THEN DATEADD(day, 21, lh.NgayHen)
                    WHEN services.CoDichVuKham = 1
                        THEN DATEADD(month, 6, lh.NgayHen)
                    ELSE DATEADD(month, 3, lh.NgayHen)
                END AS NgayTaiKham,
                CASE
                    WHEN services.CoDichVuKham = 1
                         AND tc.NgaySinh IS NOT NULL
                         AND DATEADD(year, 1, tc.NgaySinh) > lh.NgayHen
                        THEN N'Thú cưng dưới 1 tuổi, nên tái khám sau 3 tuần.'
                    WHEN services.CoDichVuKham = 1
                        THEN N'Thú cưng trên 1 tuổi, nên tái khám sau 6 tháng.'
                    ELSE N'Dịch vụ chăm sóc/spa/cắt tỉa nên hẹn lại sau 3 tháng.'
                END AS NoiDung,
                N'Pending'
            FROM LichHen lh
            INNER JOIN NguoiDung nd ON nd.MaNguoiDung = lh.MaKhachHang
            INNER JOIN ThuCung tc ON tc.MaThuCung = lh.MaThuCung
            INNER JOIN @AppointmentServices services ON services.MaLichHen = lh.MaLichHen
            WHERE lh.TrangThai = 'Completed'
              AND nd.Email IS NOT NULL
              AND LTRIM(RTRIM(nd.Email)) <> ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM NhacLichTaiKham nl
                  WHERE nl.MaLichHen = lh.MaLichHen
              );
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql);
    }

    public async Task<bool> MarkReminderSentAsync(int maNhacLich)
    {
        const string sql = """
            UPDATE NhacLichTaiKham
            SET TrangThai = N'Sent',
                NgayGui = GETDATE()
            WHERE MaNhacLich = @MaNhacLich;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql, new { MaNhacLich = maNhacLich }) > 0;
    }

    public async Task<bool> MarkReminderFailedAsync(int maNhacLich)
    {
        const string sql = """
            UPDATE NhacLichTaiKham
            SET TrangThai = N'Failed'
            WHERE MaNhacLich = @MaNhacLich;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql, new { MaNhacLich = maNhacLich }) > 0;
    }

}


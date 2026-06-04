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

    public async Task<IEnumerable<DanhGiaDto>> GetReviewsAsync(int? maDichVu, string? maKhachHang)
    {
        var sql = """
            SELECT
                dg.MaDanhGia,
                dg.MaLichHen,
                dg.MaKhachHang AS MaKhachHang,
                nd.HoVaTen AS TenKhachHang,
                dg.MaDichVu,
                dv.TenDichVu,
                dg.SoSao,
                dg.NhanXet,
                CONVERT(varchar(33), dg.NgayTao, 126) AS NgayTao
            FROM DanhGiaDichVu dg
            LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = dg.MaKhachHang
            LEFT JOIN DichVu dv ON dv.MaDichVu = dg.MaDichVu
            """;

        var where = new List<string>();
        if (maDichVu.HasValue)
        {
            where.Add("dg.MaDichVu = @MaDichVu");
        }

        if (!string.IsNullOrWhiteSpace(maKhachHang))
        {
            where.Add("dg.MaKhachHang = @MaKhachHang");
        }

        if (where.Count > 0)
        {
            sql += " WHERE " + string.Join(" AND ", where);
        }

        sql += " ORDER BY dg.NgayTao DESC;";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<DanhGiaDto>(sql, new { MaDichVu = maDichVu, MaKhachHang = maKhachHang });
    }

    public async Task<bool> CanReviewAsync(int maLichHen, string maKhachHang)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM LichHen lh
            WHERE lh.MaLichHen = @MaLichHen
              AND lh.MaKhachHang = @MaKhachHang
              AND lh.TrangThai = 'Completed'
              AND NOT EXISTS (SELECT 1 FROM DanhGiaDichVu dg WHERE dg.MaLichHen = lh.MaLichHen);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { MaLichHen = maLichHen, MaKhachHang = maKhachHang }) > 0;
    }

    public async Task<int> CreateReviewAsync(CreateDanhGiaDto request, string maKhachHang)
    {
        const string sql = """
            INSERT INTO DanhGiaDichVu (MaLichHen, MaKhachHang, MaDichVu, SoSao, NhanXet, NgayTao)
            OUTPUT INSERTED.MaDanhGia
            SELECT lh.MaLichHen, lh.MaKhachHang, lh.MaDichVu, @SoSao, @NhanXet, GETDATE()
            FROM LichHen lh
            WHERE lh.MaLichHen = @MaLichHen
              AND lh.MaKhachHang = @MaKhachHang;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new
        {
            request.MaLichHen,
            request.SoSao,
            NhanXet = string.IsNullOrWhiteSpace(request.NhanXet) ? null : request.NhanXet.Trim(),
            MaKhachHang = maKhachHang
        });
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
                ISNULL(services.TongTien, hd.TongTien) AS TongTienTruocUuDai,
                voucher.MaPhieu,
                voucher.TenUuDai,
                voucher.LoaiGiamGia,
                voucher.GiaTriGiam,
                hd.PhuongThucThanhToan,
                hd.TrangThaiThanhToan,
                hd.MaNhanVienXacNhan,
                CONVERT(varchar(33), hd.NgayThanhToan, 126) AS NgayThanhToan
            FROM HoaDon hd
            LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = hd.MaKhachHang
            OUTER APPLY (
                SELECT SUM(dv.GiaTien) AS TongTien
                FROM LichHenDichVu lhdv
                INNER JOIN DichVu dv ON dv.MaDichVu = lhdv.MaDichVu
                WHERE lhdv.MaLichHen = hd.MaLichHen
            ) services
            OUTER APPLY (
                SELECT TOP 1 p.MaPhieu, u.TenUuDai, ISNULL(u.LoaiGiamGia, N'Full') AS LoaiGiamGia, ISNULL(u.GiaTriGiam, 0) AS GiaTriGiam
                FROM PhieuUuDaiKhachHang p
                LEFT JOIN ChuongTrinhUuDai u ON u.MaUuDai = p.MaUuDai
                WHERE p.MaLichHenSuDung = hd.MaLichHen
                ORDER BY p.MaPhieu DESC
            ) voucher
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
                  AND
                  (
                      @MaPhieu IS NULL
                      OR EXISTS
                      (
                          SELECT 1
                          FROM PhieuUuDaiKhachHang p
                          WHERE p.MaPhieu = @MaPhieu
                            AND p.MaKhachHang = lh.MaKhachHang
                            AND ISNULL(p.HanSuDung, CAST(GETDATE() AS date)) >= CAST(GETDATE() AS date)
                            AND (ISNULL(p.DaSuDung, 0) = 0 OR p.MaLichHenSuDung = lh.MaLichHen)
                      )
                  )
            )
            BEGIN
                DECLARE @FinalTongTien decimal(18, 2) = @TongTien;

                IF @MaPhieu IS NOT NULL
                BEGIN
                    SELECT @FinalTongTien =
                        CASE ISNULL(u.LoaiGiamGia, N'Full')
                            WHEN N'Percent' THEN
                                CASE
                                    WHEN @TongTien - (@TongTien * ISNULL(u.GiaTriGiam, 0) / 100) < 0 THEN 0
                                    ELSE @TongTien - (@TongTien * ISNULL(u.GiaTriGiam, 0) / 100)
                                END
                            WHEN N'Fixed' THEN
                                CASE
                                    WHEN @TongTien - ISNULL(u.GiaTriGiam, 0) < 0 THEN 0
                                    ELSE @TongTien - ISNULL(u.GiaTriGiam, 0)
                                END
                            ELSE 0
                        END
                    FROM PhieuUuDaiKhachHang p
                    LEFT JOIN ChuongTrinhUuDai u ON u.MaUuDai = p.MaUuDai
                    WHERE p.MaPhieu = @MaPhieu;
                END

                UPDATE PhieuUuDaiKhachHang
                SET DaSuDung = 0,
                    MaLichHenSuDung = NULL
                WHERE MaLichHenSuDung = @MaLichHen
                  AND (@MaPhieu IS NULL OR MaPhieu <> @MaPhieu);

                IF EXISTS (SELECT 1 FROM HoaDon WHERE MaLichHen = @MaLichHen)
                BEGIN
                    UPDATE HoaDon
                    SET TongTien = @FinalTongTien,
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
                    SELECT lh.MaLichHen, lh.MaKhachHang, @FinalTongTien, @PhuongThucThanhToan, @TrangThaiThanhToan, @MaNhanVien,
                           CASE WHEN @TrangThaiThanhToan = 'Paid' THEN GETDATE() ELSE NULL END
                    FROM LichHen lh
                    WHERE lh.MaLichHen = @MaLichHen;
                END

                IF @MaPhieu IS NOT NULL
                BEGIN
                    UPDATE PhieuUuDaiKhachHang
                    SET DaSuDung = 1,
                        MaLichHenSuDung = @MaLichHen
                    WHERE MaPhieu = @MaPhieu;
                END
            END
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int?>(sql, new
        {
            request.MaLichHen,
            request.TongTien,
            request.MaPhieu,
            request.PhuongThucThanhToan,
            request.TrangThaiThanhToan,
            MaNhanVien = maNhanVien,
            IsAdmin = isAdmin
        });
    }

    public async Task<IEnumerable<ChuongTrinhUuDaiDto>> GetPromotionsAsync(bool activeOnly)
    {
        var sql = """
            SELECT MaUuDai, TenUuDai, ISNULL(SoLuotYeuCau, 0) AS SoLuotYeuCau,
                   ISNULL(ThoiHanThang, 0) AS ThoiHanThang,
                   ISNULL(LoaiGiamGia, N'Full') AS LoaiGiamGia,
                   ISNULL(GiaTriGiam, 0) AS GiaTriGiam,
                   ISNULL(TrangThai, 0) AS TrangThai
            FROM ChuongTrinhUuDai
            """;

        if (activeOnly)
        {
            sql += " WHERE ISNULL(TrangThai, 0) = 1";
        }

        sql += " ORDER BY MaUuDai DESC;";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<ChuongTrinhUuDaiDto>(sql);
    }

    public async Task<int> CreatePromotionAsync(UpsertUuDaiDto request)
    {
        const string sql = """
            INSERT INTO ChuongTrinhUuDai (TenUuDai, SoLuotYeuCau, ThoiHanThang, LoaiGiamGia, GiaTriGiam, TrangThai)
            OUTPUT INSERTED.MaUuDai
            VALUES (@TenUuDai, @SoLuotYeuCau, @ThoiHanThang, @LoaiGiamGia, @GiaTriGiam, @TrangThai);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, request);
    }

    public async Task<bool> UpdatePromotionAsync(int maUuDai, UpsertUuDaiDto request)
    {
        const string sql = """
            UPDATE ChuongTrinhUuDai
            SET TenUuDai = @TenUuDai,
                SoLuotYeuCau = @SoLuotYeuCau,
                ThoiHanThang = @ThoiHanThang,
                LoaiGiamGia = @LoaiGiamGia,
                GiaTriGiam = @GiaTriGiam,
                TrangThai = @TrangThai
            WHERE MaUuDai = @MaUuDai;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql, new
        {
            MaUuDai = maUuDai,
            request.TenUuDai,
            request.SoLuotYeuCau,
            request.ThoiHanThang,
            request.LoaiGiamGia,
            request.GiaTriGiam,
            request.TrangThai
        }) > 0;
    }

    public async Task<IEnumerable<PhieuUuDaiDto>> GetVouchersAsync(string maKhachHang)
    {
        const string sql = """
            SELECT
                p.MaPhieu,
                p.MaKhachHang AS MaKhachHang,
                p.MaUuDai,
                u.TenUuDai,
                ISNULL(u.LoaiGiamGia, N'Full') AS LoaiGiamGia,
                ISNULL(u.GiaTriGiam, 0) AS GiaTriGiam,
                CONVERT(varchar(33), p.NgayCap, 126) AS NgayCap,
                CONVERT(varchar(10), p.HanSuDung, 23) AS HanSuDung,
                ISNULL(p.DaSuDung, 0) AS DaSuDung,
                p.MaLichHenSuDung
            FROM PhieuUuDaiKhachHang p
            LEFT JOIN ChuongTrinhUuDai u ON u.MaUuDai = p.MaUuDai
            WHERE p.MaKhachHang = @MaKhachHang
            ORDER BY p.MaPhieu DESC;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<PhieuUuDaiDto>(sql, new { MaKhachHang = maKhachHang });
    }

    public async Task<IEnumerable<PhieuUuDaiDto>> GetAvailableVouchersForBookingAsync(int maLichHen, string maNhanVien, bool isAdmin)
    {
        const string sql = """
            SELECT
                p.MaPhieu,
                p.MaKhachHang AS MaKhachHang,
                p.MaUuDai,
                u.TenUuDai,
                ISNULL(u.LoaiGiamGia, N'Full') AS LoaiGiamGia,
                ISNULL(u.GiaTriGiam, 0) AS GiaTriGiam,
                CONVERT(varchar(33), p.NgayCap, 126) AS NgayCap,
                CONVERT(varchar(10), p.HanSuDung, 23) AS HanSuDung,
                ISNULL(p.DaSuDung, 0) AS DaSuDung,
                p.MaLichHenSuDung
            FROM LichHen lh
            INNER JOIN PhieuUuDaiKhachHang p ON p.MaKhachHang = lh.MaKhachHang
            LEFT JOIN ChuongTrinhUuDai u ON u.MaUuDai = p.MaUuDai
            WHERE lh.MaLichHen = @MaLichHen
              AND (@IsAdmin = 1 OR lh.MaNhanVien = @MaNhanVien)
              AND ISNULL(p.DaSuDung, 0) = 0
              AND ISNULL(p.HanSuDung, CAST(GETDATE() AS date)) >= CAST(GETDATE() AS date)
            ORDER BY p.HanSuDung, p.MaPhieu;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<PhieuUuDaiDto>(sql, new
        {
            MaLichHen = maLichHen,
            MaNhanVien = maNhanVien,
            IsAdmin = isAdmin
        });
    }

    public async Task<int> IssueVoucherAsync(IssueUuDaiDto request)
    {
        const string sql = """
            INSERT INTO PhieuUuDaiKhachHang (MaKhachHang, MaUuDai, NgayCap, HanSuDung, DaSuDung)
            OUTPUT INSERTED.MaPhieu
            SELECT @MaKhachHang, u.MaUuDai, GETDATE(), DATEADD(month, ISNULL(u.ThoiHanThang, 1), CAST(GETDATE() AS date)), 0
            FROM ChuongTrinhUuDai u
            WHERE u.MaUuDai = @MaUuDai AND ISNULL(u.TrangThai, 0) = 1;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, request);
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
                lh.GhiChu
            FROM LichHen lh
            INNER JOIN ThuCung tc ON tc.MaThuCung = lh.MaThuCung
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

    public async Task<IEnumerable<PetVisitImageDto>> GetVisitImagesAsync(int? maLichHen, int? maThuCung, string userId, bool isPrivileged)
    {
        var sql = """
            SELECT a.MaAnh, a.MaLichHen, a.MaThuCung, a.LoaiAnh, a.AnhUrl, a.GhiChu, CONVERT(varchar(33), a.NgayTaiLen, 126) AS NgayTaiLen
            FROM AnhKhamThuCung a
            INNER JOIN ThuCung tc ON tc.MaThuCung = a.MaThuCung
            """;
        var where = new List<string>();
        if (!isPrivileged)
        {
            where.Add("tc.MaChuNhan = @UserId");
        }
        if (maLichHen.HasValue)
        {
            where.Add("a.MaLichHen = @MaLichHen");
        }
        if (maThuCung.HasValue)
        {
            where.Add("a.MaThuCung = @MaThuCung");
        }
        if (where.Count > 0)
        {
            sql += " WHERE " + string.Join(" AND ", where);
        }
        sql += " ORDER BY NgayTaiLen DESC;";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<PetVisitImageDto>(sql, new { MaLichHen = maLichHen, MaThuCung = maThuCung, UserId = userId });
    }

    public async Task<int> AddVisitImageAsync(CreatePetVisitImageDto request)
    {
        const string sql = """
            INSERT INTO AnhKhamThuCung (MaLichHen, MaThuCung, LoaiAnh, AnhUrl, GhiChu)
            OUTPUT INSERTED.MaAnh
            VALUES (@MaLichHen, @MaThuCung, @LoaiAnh, @AnhUrl, @GhiChu);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, request);
    }

    public async Task<string?> DeleteVisitImageAsync(int maAnh, string userId, bool isAdmin)
    {
        const string selectSql = """
            SELECT a.AnhUrl
            FROM AnhKhamThuCung a
            INNER JOIN LichHen lh ON lh.MaLichHen = a.MaLichHen
            WHERE a.MaAnh = @MaAnh AND (@IsAdmin = 1 OR lh.MaNhanVien = @UserId);
            """;
        using var connection = _connectionFactory.CreateConnection();
        var url = await connection.ExecuteScalarAsync<string?>(selectSql, new { MaAnh = maAnh, UserId = userId, IsAdmin = isAdmin });
        if (url is null) return null;
        await connection.ExecuteAsync("DELETE FROM AnhKhamThuCung WHERE MaAnh = @MaAnh;", new { MaAnh = maAnh });
        return url;
    }

    public async Task<bool> CanManageVisitImageAsync(int maLichHen, int maThuCung, string maNhanVien, bool isAdmin)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM LichHen
            WHERE MaLichHen = @MaLichHen
              AND MaThuCung = @MaThuCung
              AND (@IsAdmin = 1 OR MaNhanVien = @MaNhanVien);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new
        {
            MaLichHen = maLichHen,
            MaThuCung = maThuCung,
            MaNhanVien = maNhanVien,
            IsAdmin = isAdmin
        }) > 0;
    }

    public async Task<IEnumerable<DepositDto>> GetDepositsAsync(string? maKhachHang)
    {
        var sql = """
            SELECT
                dc.MaDatCoc,
                dc.MaLichHen,
                dc.MaKhachHang AS MaKhachHang,
                nd.HoVaTen AS TenKhachHang,
                dc.SoTien,
                dc.PhuongThuc,
                dc.MaGiaoDich,
                dc.TrangThai,
                CONVERT(varchar(33), dc.NgayTao, 126) AS NgayTao,
                CONVERT(varchar(33), dc.NgayThanhToan, 126) AS NgayThanhToan,
                dc.BienLaiUrl,
                dc.GhiChuKhachHang,
                dc.MaNguoiDuyet,
                CONVERT(varchar(33), dc.NgayDuyet, 126) AS NgayDuyet,
                dc.LyDoTuChoi
            FROM DatCocThanhToan dc
            LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = dc.MaKhachHang
            """;

        if (!string.IsNullOrWhiteSpace(maKhachHang))
        {
            sql += " WHERE dc.MaKhachHang = @MaKhachHang";
        }

        sql += " ORDER BY dc.MaDatCoc DESC;";
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<DepositDto>(sql, new { MaKhachHang = maKhachHang });
    }

    public async Task<DepositDto?> GetDepositByIdAsync(int maDatCoc)
    {
        const string sql = """
            SELECT
                dc.MaDatCoc,
                dc.MaLichHen,
                dc.MaKhachHang AS MaKhachHang,
                nd.HoVaTen AS TenKhachHang,
                dc.SoTien,
                dc.PhuongThuc,
                dc.MaGiaoDich,
                dc.TrangThai,
                CONVERT(varchar(33), dc.NgayTao, 126) AS NgayTao,
                CONVERT(varchar(33), dc.NgayThanhToan, 126) AS NgayThanhToan,
                dc.BienLaiUrl,
                dc.GhiChuKhachHang,
                dc.MaNguoiDuyet,
                CONVERT(varchar(33), dc.NgayDuyet, 126) AS NgayDuyet,
                dc.LyDoTuChoi
            FROM DatCocThanhToan dc
            LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = dc.MaKhachHang
            WHERE dc.MaDatCoc = @MaDatCoc;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<DepositDto>(sql, new { MaDatCoc = maDatCoc });
    }

    public async Task<int?> CreateDepositAsync(CreateDepositDto request, string maKhachHang)
    {
        const string sql = """
            INSERT INTO DatCocThanhToan (MaLichHen, MaKhachHang, SoTien, PhuongThuc, MaGiaoDich, TrangThai)
            OUTPUT INSERTED.MaDatCoc
            SELECT lh.MaLichHen, lh.MaKhachHang, @SoTien, N'BANK_TRANSFER',
                   CONCAT(N'CK-LH-', lh.MaLichHen, N'-', FORMAT(GETDATE(), 'yyyyMMddHHmmss')), N'Pending'
            FROM LichHen lh
            WHERE lh.MaLichHen = @MaLichHen
              AND lh.MaKhachHang = @MaKhachHang
              AND lh.TrangThai IN ('Pending', 'Confirmed')
              AND NOT EXISTS
              (
                  SELECT 1
                  FROM DatCocThanhToan dc
                  WHERE dc.MaLichHen = lh.MaLichHen
                    AND dc.TrangThai IN (N'Pending', N'Submitted', N'Paid')
              );
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int?>(sql, new { request.MaLichHen, request.SoTien, MaKhachHang = maKhachHang });
    }

    public async Task<bool> SaveDepositReceiptAsync(int maDatCoc, string maKhachHang, string bienLaiUrl, string? ghiChu)
    {
        const string sql = """
            UPDATE DatCocThanhToan
            SET BienLaiUrl = @BienLaiUrl,
                GhiChuKhachHang = @GhiChu,
                TrangThai = N'Submitted',
                LyDoTuChoi = NULL,
                MaNguoiDuyet = NULL,
                NgayDuyet = NULL
            WHERE MaDatCoc = @MaDatCoc
              AND MaKhachHang = @MaKhachHang
              AND TrangThai IN (N'Pending', N'Rejected', N'Submitted');
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql, new
        {
            MaDatCoc = maDatCoc,
            MaKhachHang = maKhachHang,
            BienLaiUrl = bienLaiUrl,
            GhiChu = string.IsNullOrWhiteSpace(ghiChu) ? null : ghiChu.Trim()
        }) > 0;
    }

    public async Task<bool> ReviewDepositAsync(int maDatCoc, string maNguoiDuyet, bool chapNhan, string? lyDoTuChoi)
    {
        const string sql = """
            UPDATE DatCocThanhToan
            SET TrangThai = CASE WHEN @ChapNhan = 1 THEN N'Paid' ELSE N'Rejected' END,
                NgayThanhToan = CASE WHEN @ChapNhan = 1 THEN GETDATE() ELSE NULL END,
                MaNguoiDuyet = @MaNguoiDuyet,
                NgayDuyet = GETDATE(),
                LyDoTuChoi = CASE WHEN @ChapNhan = 1 THEN NULL ELSE @LyDoTuChoi END
            WHERE MaDatCoc = @MaDatCoc
              AND TrangThai IN (N'Pending', N'Submitted', N'Rejected')
              AND (@ChapNhan = 0 OR BienLaiUrl IS NOT NULL);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql, new
        {
            MaDatCoc = maDatCoc,
            MaNguoiDuyet = maNguoiDuyet,
            ChapNhan = chapNhan,
            LyDoTuChoi = string.IsNullOrWhiteSpace(lyDoTuChoi) ? null : lyDoTuChoi.Trim()
        }) > 0;
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

    public async Task<int> ClaimLoyaltyVoucherAsync(string maKhachHang)
    {
        const string sql = """
            DECLARE @CompletedCount int = (
                SELECT COUNT(1)
                FROM LichHen
                WHERE MaKhachHang = @MaKhachHang AND TrangThai = 'Completed'
            );

            IF @CompletedCount < 3
            BEGIN
                SELECT 0;
                RETURN;
            END

            DECLARE @MaUuDai int = (
                SELECT TOP 1 MaUuDai
                FROM ChuongTrinhUuDai
                WHERE TenUuDai = N'Miễn phí 1 lần khám sau 3 lần hoàn thành'
            );

            IF @MaUuDai IS NULL
            BEGIN
                INSERT INTO ChuongTrinhUuDai (TenUuDai, SoLuotYeuCau, ThoiHanThang, LoaiGiamGia, GiaTriGiam, TrangThai)
                VALUES (N'Miễn phí 1 lần khám sau 3 lần hoàn thành', 3, 3, N'Full', 0, 1);
                SET @MaUuDai = SCOPE_IDENTITY();
            END

            IF EXISTS (
                SELECT 1
                FROM PhieuUuDaiKhachHang
                WHERE MaKhachHang = @MaKhachHang
                  AND MaUuDai = @MaUuDai
                  AND ISNULL(DaSuDung, 0) = 0
            )
            BEGIN
                SELECT 0;
                RETURN;
            END

            INSERT INTO PhieuUuDaiKhachHang (MaKhachHang, MaUuDai, NgayCap, HanSuDung, DaSuDung)
            OUTPUT INSERTED.MaPhieu
            VALUES (@MaKhachHang, @MaUuDai, GETDATE(), DATEADD(month, 3, CAST(GETDATE() AS date)), 0);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { MaKhachHang = maKhachHang });
    }
}


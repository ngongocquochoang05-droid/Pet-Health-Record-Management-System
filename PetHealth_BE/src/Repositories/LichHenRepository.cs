using Dapper;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;

namespace PetHealth_BE.src.Repositories;

public class LichHenRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public LichHenRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<LichHenDto>> GetAllAsync(string? maNguoiDung, string? maNhanVien = null)
    {
        var sql = """
            SELECT
                lh.MaLichHen,
                lh.MaKhachHang AS MaNguoiDung,
                nd.HoVaTen AS TenKhachHang,
                nd.Email AS EmailKhachHang,
                lh.MaThuCung,
                tc.TenThuCung,
                lh.MaDichVu,
                services.MaDichVuCsv,
                services.TenDichVu,
                lh.MaNhanVien AS MaNhanVien,
                nv.HoVaTen AS TenNhanVien,
                CONVERT(varchar(10), lh.NgayHen, 23) AS NgayHen,
                LEFT(CONVERT(varchar(8), lh.GioBatDau, 108), 5) AS GioHen,
                lh.TrangThai,
                services.TongTien,
                lh.GhiChu,
                CONVERT(varchar(33), lh.NgayTao, 126) AS CreatedAt
            FROM LichHen lh
            INNER JOIN NguoiDung nd ON nd.MaNguoiDung = lh.MaKhachHang
            INNER JOIN ThuCung tc ON tc.MaThuCung = lh.MaThuCung
            OUTER APPLY (
                SELECT
                    STRING_AGG(CONVERT(varchar(20), dv.MaDichVu), ',') WITHIN GROUP (ORDER BY dv.MaDichVu) AS MaDichVuCsv,
                    STRING_AGG(dv.TenDichVu, N', ') WITHIN GROUP (ORDER BY dv.MaDichVu) AS TenDichVu,
                    SUM(dv.GiaTien) AS TongTien
                FROM LichHenDichVu lhdv
                INNER JOIN DichVu dv ON dv.MaDichVu = lhdv.MaDichVu
                WHERE lhdv.MaLichHen = lh.MaLichHen
            ) services
            LEFT JOIN NguoiDung nv ON nv.MaNguoiDung = lh.MaNhanVien
            """;

        var where = new List<string>();
        if (!string.IsNullOrWhiteSpace(maNguoiDung))
        {
            where.Add("lh.MaKhachHang = @MaNguoiDung");
        }

        if (!string.IsNullOrWhiteSpace(maNhanVien))
        {
            where.Add("lh.MaNhanVien = @MaNhanVien");
        }

        if (where.Count > 0)
        {
            sql += " WHERE " + string.Join(" AND ", where);
        }

        sql += " ORDER BY lh.NgayHen, lh.GioBatDau;";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<LichHenDto>(sql, new { MaNguoiDung = maNguoiDung, MaNhanVien = maNhanVien });
    }

    public async Task<LichHenDto?> GetByIdAsync(int maLichHen)
    {
        const string sql = """
            SELECT
                lh.MaLichHen,
                lh.MaKhachHang AS MaNguoiDung,
                nd.HoVaTen AS TenKhachHang,
                nd.Email AS EmailKhachHang,
                lh.MaThuCung,
                tc.TenThuCung,
                lh.MaDichVu,
                services.MaDichVuCsv,
                services.TenDichVu,
                lh.MaNhanVien AS MaNhanVien,
                nv.HoVaTen AS TenNhanVien,
                CONVERT(varchar(10), lh.NgayHen, 23) AS NgayHen,
                LEFT(CONVERT(varchar(8), lh.GioBatDau, 108), 5) AS GioHen,
                lh.TrangThai,
                services.TongTien,
                lh.GhiChu,
                CONVERT(varchar(33), lh.NgayTao, 126) AS CreatedAt
            FROM LichHen lh
            INNER JOIN NguoiDung nd ON nd.MaNguoiDung = lh.MaKhachHang
            INNER JOIN ThuCung tc ON tc.MaThuCung = lh.MaThuCung
            OUTER APPLY (
                SELECT
                    STRING_AGG(CONVERT(varchar(20), dv.MaDichVu), ',') WITHIN GROUP (ORDER BY dv.MaDichVu) AS MaDichVuCsv,
                    STRING_AGG(dv.TenDichVu, N', ') WITHIN GROUP (ORDER BY dv.MaDichVu) AS TenDichVu,
                    SUM(dv.GiaTien) AS TongTien
                FROM LichHenDichVu lhdv
                INNER JOIN DichVu dv ON dv.MaDichVu = lhdv.MaDichVu
                WHERE lhdv.MaLichHen = lh.MaLichHen
            ) services
            LEFT JOIN NguoiDung nv ON nv.MaNguoiDung = lh.MaNhanVien
            WHERE lh.MaLichHen = @MaLichHen;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<LichHenDto>(sql, new { MaLichHen = maLichHen });
    }

    public async Task<bool> HasConflictAsync(int maThuCung, DateTime ngayHen, TimeSpan gioHen, int? excludeBookingId = null)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM LichHen
            WHERE MaThuCung = @MaThuCung
              AND NgayHen = @NgayHen
              AND GioBatDau = @GioHen
              AND (@ExcludeBookingId IS NULL OR MaLichHen <> @ExcludeBookingId)
              AND TrangThai IN ('Pending', 'Confirmed');
            """;

        using var connection = _connectionFactory.CreateConnection();
        var count = await connection.ExecuteScalarAsync<int>(sql, new
        {
            MaThuCung = maThuCung,
            NgayHen = ngayHen,
            GioHen = gioHen,
            ExcludeBookingId = excludeBookingId
        });

        return count > 0;
    }

    public async Task<int> CreateAsync(LichHen appointment, IReadOnlyCollection<int> maDichVus, string? maNhanVien)
    {
        const string sql = """
            INSERT INTO LichHenDichVu (MaLichHen, MaDichVu)
            VALUES (@MaLichHen, @MaDichVu);
            """;

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        var duration = await connection.ExecuteScalarAsync<int>(
            "SELECT SUM(ThoiGianThucHien) FROM DichVu WHERE MaDichVu IN @MaDichVus;",
            new { MaDichVus = maDichVus },
            transaction);
        var id = await connection.ExecuteScalarAsync<int>(
            """
            DECLARE @CreatedAppointments TABLE (MaLichHen int);

            INSERT INTO LichHen (MaKhachHang, MaThuCung, MaNhanVien, MaDichVu, NgayHen, GioBatDau, GioKetThuc, TrangThai, GhiChu, NgayTao)
            OUTPUT INSERTED.MaLichHen INTO @CreatedAppointments
            VALUES (@MaNguoiDung, @MaThuCung, @MaNhanVien, @MaDichVu, @NgayHen, @GioHen, DATEADD(minute, @DurationMinutes, CAST(@GioHen AS time)), @TrangThai, @GhiChu, @CreatedAt);

            SELECT MaLichHen FROM @CreatedAppointments;
            """,
            new
            {
                appointment.MaNguoiDung,
                appointment.MaThuCung,
                appointment.MaDichVu,
                NgayHen = appointment.NgayHen.Date,
                GioHen = appointment.GioHen.ToTimeSpan(),
                appointment.TrangThai,
                appointment.GhiChu,
                appointment.CreatedAt,
                MaNhanVien = maNhanVien,
                DurationMinutes = duration
            },
            transaction);
        await connection.ExecuteAsync(sql, maDichVus.Select(maDichVu => new
        {
            MaLichHen = id,
            MaDichVu = maDichVu
        }), transaction);
        transaction.Commit();
        return id;
    }

    public async Task<bool> UpdateStatusAsync(int maLichHen, string trangThai, string? ghiChu = null)
    {
        const string sql = """
            UPDATE LichHen
            SET TrangThai = @TrangThai,
                GhiChu = COALESCE(@GhiChu, GhiChu)
            WHERE MaLichHen = @MaLichHen;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new { MaLichHen = maLichHen, TrangThai = trangThai, GhiChu = ghiChu });
        return affected > 0;
    }

    public async Task<bool> AssignStaffAsync(int maLichHen, string maNhanVien)
    {
        const string sql = """
            UPDATE LichHen
            SET MaNhanVien = @MaNhanVien
            WHERE MaLichHen = @MaLichHen
              AND TrangThai IN ('Pending', 'Confirmed')
              AND EXISTS (
                  SELECT 1 FROM NguoiDung
                  WHERE MaNguoiDung = @MaNhanVien AND VaiTro = 'Staff' AND TrangThaiHoatDong = 1
              );
            """;
        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql, new { MaLichHen = maLichHen, MaNhanVien = maNhanVien }) > 0;
    }

    public async Task<bool> UpdateStatusForOwnerAsync(int maLichHen, string maNguoiDung, string trangThai, string? ghiChu = null)
    {
        const string sql = """
            UPDATE LichHen
            SET TrangThai = @TrangThai,
                GhiChu = COALESCE(@GhiChu, GhiChu)
            WHERE MaLichHen = @MaLichHen
              AND MaKhachHang = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaLichHen = maLichHen,
            MaNguoiDung = maNguoiDung,
            TrangThai = trangThai,
            GhiChu = ghiChu
        });
        return affected > 0;
    }

    public async Task<bool> UpdateStatusForStaffAsync(int maLichHen, string maNhanVien, string trangThai, string? ghiChu = null)
    {
        const string sql = """
            UPDATE LichHen
            SET TrangThai = @TrangThai,
                GhiChu = COALESCE(@GhiChu, GhiChu)
            WHERE MaLichHen = @MaLichHen
              AND MaNhanVien = @MaNhanVien
              AND TrangThai IN ('Pending', 'Confirmed');
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaLichHen = maLichHen,
            MaNhanVien = maNhanVien,
            TrangThai = trangThai,
            GhiChu = ghiChu
        });
        return affected > 0;
    }

    public async Task<bool> UpdateAsync(int maLichHen, string maNguoiDung, UpdateLichHenDto request, IReadOnlyCollection<int> maDichVus, string? maNhanVien)
    {
        const string sql = """
            UPDATE LichHen
            SET MaThuCung = @MaThuCung,
                MaDichVu = @MaDichVu,
                MaNhanVien = @MaNhanVien,
                NgayHen = @NgayHen,
                GioBatDau = @GioHen,
                GioKetThuc = DATEADD(minute, @DurationMinutes, CAST(@GioHen AS time)),
                GhiChu = @GhiChu
            WHERE MaLichHen = @MaLichHen
              AND MaKhachHang = @MaNguoiDung
              AND TrangThai IN ('Pending', 'Confirmed');
        """;

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        var duration = await connection.ExecuteScalarAsync<int>(
            "SELECT SUM(ThoiGianThucHien) FROM DichVu WHERE MaDichVu IN @MaDichVus;",
            new { MaDichVus = maDichVus },
            transaction);
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaLichHen = maLichHen,
            MaNguoiDung = maNguoiDung,
            request.MaThuCung,
            MaDichVu = maDichVus.First(),
            NgayHen = DateTime.Parse(request.NgayHen).Date,
            GioHen = TimeSpan.Parse(request.GioHen),
            request.GhiChu,
            MaNhanVien = maNhanVien,
            DurationMinutes = duration
        }, transaction);

        if (affected > 0)
        {
            await connection.ExecuteAsync("DELETE FROM LichHenDichVu WHERE MaLichHen = @MaLichHen;", new { MaLichHen = maLichHen }, transaction);
            await connection.ExecuteAsync(
                "INSERT INTO LichHenDichVu (MaLichHen, MaDichVu) VALUES (@MaLichHen, @MaDichVu);",
                maDichVus.Select(maDichVu => new { MaLichHen = maLichHen, MaDichVu = maDichVu }),
                transaction);
        }

        transaction.Commit();
        return affected > 0;
    }

    public async Task<BookingAvailabilityDto> GetAvailabilityAsync(DateTime ngayHen, TimeSpan gioHen)
    {
        const string sql = """
            SELECT
                SUM(CASE WHEN NgayHen = @NgayHen AND TrangThai IN ('Pending', 'Confirmed') THEN 1 ELSE 0 END) AS SoLichTrongNgay,
                SUM(CASE WHEN NgayHen = @NgayHen AND GioBatDau = @GioHen AND TrangThai IN ('Pending', 'Confirmed') THEN 1 ELSE 0 END) AS SoLichTrongKhungGio
            FROM LichHen;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var counts = await connection.QuerySingleAsync(sql, new { NgayHen = ngayHen.Date, GioHen = gioHen });
        var dateCount = Convert.ToInt32(counts.SoLichTrongNgay ?? 0);
        var slotCount = Convert.ToInt32(counts.SoLichTrongKhungGio ?? 0);
        var suggestions = await GetRecommendedDatesAsync(ngayHen);
        var isDateBusy = dateCount >= 8;
        var isSlotBusy = slotCount >= 5;

        return new BookingAvailabilityDto
        {
            NgayHen = ngayHen.ToString("yyyy-MM-dd"),
            GioHen = $"{gioHen:hh\\:mm}",
            SoLichTrongNgay = dateCount,
            SoLichTrongKhungGio = slotCount,
            NgayDangDong = isDateBusy,
            KhungGioDangDong = isSlotBusy,
            NgayGoiY = suggestions,
            ThongBao = isDateBusy
                ? "Ngày này đang đông khách, nên ưu tiên ngày khác ít lịch hơn."
                : isSlotBusy
                    ? "Khung giờ này đang đông khách, hãy chọn khung giờ khác nếu có thể."
                    : "Khung giờ hiện tại vẫn còn phù hợp để đặt lịch."
        };
    }

    public async Task<IEnumerable<SuggestedDateDto>> GetRecommendedDatesAsync(DateTime fromDate)
    {
        const string sql = """
            WITH NextDays AS (
                SELECT CAST(@FromDate AS date) AS NgayHen, 0 AS StepIndex
                UNION ALL
                SELECT DATEADD(day, 1, NgayHen), StepIndex + 1
                FROM NextDays
                WHERE StepIndex < 13
            )
            SELECT TOP 5
                CONVERT(varchar(10), nd.NgayHen, 23) AS NgayHen,
                COUNT(lh.MaLichHen) AS SoLich
            FROM NextDays nd
            LEFT JOIN LichHen lh
                ON lh.NgayHen = nd.NgayHen
               AND lh.TrangThai IN ('Pending', 'Confirmed')
            GROUP BY nd.NgayHen
            ORDER BY SoLich ASC, nd.NgayHen ASC
            OPTION (MAXRECURSION 20);
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<SuggestedDateDto>(sql, new { FromDate = fromDate.Date });
    }

    public async Task<StaffDto?> GetBestAvailableStaffAsync(DateTime ngayHen, TimeSpan gioHen)
    {
        const string sql = """
            SELECT TOP 1
                nd.MaNguoiDung AS MaNhanVien,
                nd.HoVaTen,
                nd.Email,
                nd.SoDienThoai,
                hs.ChuyenMon,
                hs.NamKinhNghiem,
                hs.DiemDanhGia,
                ISNULL(hs.SanSangLamViec, 0) AS SanSangLamViec
            FROM HoSoNhanVien hs
            INNER JOIN NguoiDung nd ON nd.MaNguoiDung = hs.MaNhanVien
            INNER JOIN CaLamViec cl ON cl.MaNhanVien = hs.MaNhanVien
                AND cl.NgayLam = @NgayHen
                AND cl.GioBatDau <= @GioHen
                AND cl.GioKetThuc > @GioHen
                AND cl.TrangThai = 'Available'
            OUTER APPLY (
                SELECT COUNT(1) AS AssignedCount
                FROM LichHen lh
                WHERE lh.MaNhanVien = hs.MaNhanVien
                  AND lh.NgayHen = @NgayHen
                  AND lh.GioBatDau = @GioHen
                  AND lh.TrangThai IN ('Pending', 'Confirmed')
            ) load
            WHERE ISNULL(hs.SanSangLamViec, 0) = 1
              AND nd.VaiTro = 'Staff'
              AND nd.TrangThaiHoatDong = 1
              AND ISNULL(load.AssignedCount, 0) < 3
            ORDER BY ISNULL(load.AssignedCount, 0), hs.DiemDanhGia DESC, hs.NamKinhNghiem DESC;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<StaffDto>(sql, new { NgayHen = ngayHen.Date, GioHen = gioHen });
    }

    public async Task<IEnumerable<StaffDto>> GetStaffAsync()
    {
        const string sql = """
            SELECT
                nd.MaNguoiDung AS MaNhanVien,
                nd.HoVaTen,
                nd.Email,
                nd.SoDienThoai,
                hs.ChuyenMon,
                hs.NamKinhNghiem,
                hs.DiemDanhGia,
                ISNULL(hs.SanSangLamViec, 0) AS SanSangLamViec
            FROM HoSoNhanVien hs
            INNER JOIN NguoiDung nd ON nd.MaNguoiDung = hs.MaNhanVien
            WHERE nd.VaiTro = 'Staff'
              AND nd.TrangThaiHoatDong = 1
            ORDER BY hs.SanSangLamViec DESC, hs.DiemDanhGia DESC, nd.HoVaTen;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<StaffDto>(sql);
    }

}

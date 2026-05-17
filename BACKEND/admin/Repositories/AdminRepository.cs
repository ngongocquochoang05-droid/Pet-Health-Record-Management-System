using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using MyPuppy.Admin.Models;

namespace MyPuppy.Admin.Repositories;

public class AdminRepository
{
    private readonly string _connectionString;

    public AdminRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("PetHealth")
            ?? throw new InvalidOperationException("Missing connection string PetHealth.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    private static string NormalizeRole(string? value)
        => (value ?? "customer").Trim().ToLowerInvariant();

    private static string ToDatabaseRole(string value)
        => NormalizeRole(value) switch
        {
            "admin" => "Admin",
            "staff" => "Staff",
            _ => "Customer"
        };

    private static string ToUserStatus(bool? active) => active == true ? "active" : "locked";

    private static bool ToDatabaseActiveStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return true;
        var s = status.Trim().ToLowerInvariant();
        return s != "locked" && s != "inactive";
    }

    private static string ToStaffStatus(bool? userActive, bool? available)
    {
        if (userActive != true) return "inactive";
        if (available == false) return "on_leave";
        return "active";
    }

    private static (bool userActive, bool staffReady) GetStaffStatusUpdate(string status)
        => status.ToLowerInvariant() switch
        {
            "inactive" => (false, false),
            "on_leave" => (true, false),
            _ => (true, true)
        };

    /* =========================================================
       USERS
       ========================================================= */

    public async Task<IEnumerable<UserDto>> ListUsersAsync(string? role, string? status, string? search)
    {
        var where = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(role))
        {
            where.Add("LOWER(VaiTro) = @role");
            parameters.Add("role", role.Trim().ToLowerInvariant());
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            where.Add("TrangThaiHoatDong = @activeStatus");
            parameters.Add("activeStatus", status.Trim().ToLowerInvariant() == "active");
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            where.Add("(HoVaTen LIKE '%' + @search + '%' OR Email LIKE '%' + @search + '%' OR SoDienThoai LIKE '%' + @search + '%')");
            parameters.Add("search", search.Trim());
        }

        var whereSql = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : string.Empty;
        var sql = $@"
            SELECT MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, DiaChi, GioiTinh, VaiTro, TrangThaiHoatDong, NgayTao
            FROM dbo.NguoiDung
            {whereSql}
            ORDER BY NgayTao DESC;";

        using var conn = CreateConnection();
        var rows = await conn.QueryAsync(sql, parameters);
        return rows.Select(MapUser).Where(u => u != null)!;
    }

    public async Task<UserDto?> GetUserByIdAsync(string id)
    {
        const string sql = @"
            SELECT MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, DiaChi, GioiTinh, VaiTro, TrangThaiHoatDong, NgayTao
            FROM dbo.NguoiDung
            WHERE MaNguoiDungClerk = @id;";

        using var conn = CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync(sql, new { id });
        return row == null ? null : MapUser(row);
    }

    public async Task<UserDto?> UpdateUserAsync(string id, string? role = null, string? status = null)
    {
        var assignments = new List<string>();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);

        if (role != null)
        {
            assignments.Add("VaiTro = @role");
            parameters.Add("role", ToDatabaseRole(role));
        }

        if (status != null)
        {
            assignments.Add("TrangThaiHoatDong = @status");
            parameters.Add("status", ToDatabaseActiveStatus(status));
        }

        if (assignments.Count == 0)
            return await GetUserByIdAsync(id);

        var sql = $@"
            UPDATE dbo.NguoiDung
            SET {string.Join(", ", assignments)}
            OUTPUT INSERTED.MaNguoiDungClerk, INSERTED.HoVaTen, INSERTED.Email, INSERTED.SoDienThoai,
                   INSERTED.DiaChi, INSERTED.GioiTinh, INSERTED.VaiTro, INSERTED.TrangThaiHoatDong, INSERTED.NgayTao
            WHERE MaNguoiDungClerk = @id;";

        using var conn = CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync(sql, parameters);

        // Khi promote user lên Staff: tự động tạo HoSoNhanVien nếu chưa có.
        if (role != null && NormalizeRole(role) == "staff")
        {
            const string ensureStaffSql = @"
                IF NOT EXISTS (SELECT 1 FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id)
                BEGIN
                    INSERT INTO dbo.HoSoNhanVien (MaNhanVienClerk, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
                    VALUES (@id, N'', 0, 0, 1);
                END";
            await conn.ExecuteAsync(ensureStaffSql, new { id });
        }

        return row == null ? null : MapUser(row);
    }

    private static UserDto MapUser(dynamic row)
    {
        return new UserDto(
            Id: (string)(row.MaNguoiDungClerk ?? string.Empty),
            FullName: (string)(row.HoVaTen ?? string.Empty),
            Email: (string)(row.Email ?? string.Empty),
            Phone: (string)(row.SoDienThoai ?? string.Empty),
            Address: (string)(row.DiaChi ?? string.Empty),
            Gender: (string)(row.GioiTinh ?? string.Empty),
            Role: NormalizeRole((string?)row.VaiTro),
            Status: ToUserStatus((bool?)row.TrangThaiHoatDong),
            CreatedAt: (DateTime?)row.NgayTao
        );
    }

    /* =========================================================
       WEBHOOK SYNC (Clerk -> SQL Server)
       Idempotent upsert + delete cho dbo.NguoiDung
       ========================================================= */

    public async Task UpsertUserFromWebhookAsync(
        string clerkUserId,
        string fullName,
        string email,
        string phone,
        string? role,
        bool isActive,
        DateTime? createdAt)
    {
        const string sql = @"
            MERGE dbo.NguoiDung AS target
            USING (SELECT @id AS MaNguoiDungClerk) AS src
                ON target.MaNguoiDungClerk = src.MaNguoiDungClerk
            WHEN MATCHED THEN
                UPDATE SET
                    HoVaTen = @fullName,
                    Email = @email,
                    SoDienThoai = @phone,
                    VaiTro = COALESCE(@role, target.VaiTro),
                    TrangThaiHoatDong = @isActive
            WHEN NOT MATCHED THEN
                INSERT (MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, VaiTro, TrangThaiHoatDong, NgayTao)
                VALUES (@id, @fullName, @email, @phone, COALESCE(@role, 'Customer'), @isActive, ISNULL(@createdAt, SYSUTCDATETIME()));";

        var parameters = new DynamicParameters();
        parameters.Add("id", clerkUserId);
        parameters.Add("fullName", fullName ?? string.Empty);
        parameters.Add("email", email ?? string.Empty);
        parameters.Add("phone", phone ?? string.Empty);
        parameters.Add("role", role == null ? null : ToDatabaseRole(role));
        parameters.Add("isActive", isActive);
        parameters.Add("createdAt", createdAt);

        using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, parameters);
    }

    public async Task DeleteUserByClerkIdAsync(string clerkUserId)
    {
        // Xoa profile staff truoc neu co (FK), roi xoa user.
        const string sql = @"
            DELETE FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id;
            DELETE FROM dbo.NguoiDung WHERE MaNguoiDungClerk = @id;";

        using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { id = clerkUserId });
    }

    /* =========================================================
       STAFF
       ========================================================= */

    public async Task<IEnumerable<StaffDto>> ListStaffAsync(string? status, string? search)
    {
        var where = new List<string> { "LOWER(n.VaiTro) = 'staff'" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var s = status.Trim().ToLowerInvariant();
            if (s == "active")
                where.Add("n.TrangThaiHoatDong = 1 AND ISNULL(h.SanSangLamViec, 1) = 1");
            else if (s == "on_leave")
                where.Add("n.TrangThaiHoatDong = 1 AND ISNULL(h.SanSangLamViec, 0) = 0");
            else
                where.Add("n.TrangThaiHoatDong = 0");
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            where.Add("(n.HoVaTen LIKE '%' + @search + '%' OR n.Email LIKE '%' + @search + '%' OR h.ChuyenMon LIKE '%' + @search + '%' OR n.SoDienThoai LIKE '%' + @search + '%')");
            parameters.Add("search", search.Trim());
        }

        var sql = $@"
            SELECT
                n.MaNguoiDungClerk, n.HoVaTen, n.Email, n.SoDienThoai, n.VaiTro,
                n.TrangThaiHoatDong, n.NgayTao,
                h.ChuyenMon, h.NamKinhNghiem, h.DiemDanhGia, h.SanSangLamViec
            FROM dbo.NguoiDung n
            LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
            WHERE {string.Join(" AND ", where)}
            ORDER BY n.NgayTao DESC;";

        using var conn = CreateConnection();
        var rows = await conn.QueryAsync(sql, parameters);
        return rows.Select(MapStaff).Where(s => s != null)!;
    }

    public async Task<StaffDto?> GetStaffByIdAsync(string id)
    {
        const string sql = @"
            SELECT
                n.MaNguoiDungClerk, n.HoVaTen, n.Email, n.SoDienThoai, n.VaiTro,
                n.TrangThaiHoatDong, n.NgayTao,
                h.ChuyenMon, h.NamKinhNghiem, h.DiemDanhGia, h.SanSangLamViec
            FROM dbo.NguoiDung n
            LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
            WHERE n.MaNguoiDungClerk = @id AND LOWER(n.VaiTro) = 'staff';";

        using var conn = CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync(sql, new { id });
        return row == null ? null : MapStaff(row);
    }

    public async Task<StaffDto?> UpdateStaffAsync(string id, UpdateStaffRequest payload)
    {
        var userAssignments = new List<string>();
        var staffAssignments = new List<string>();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);

        if (payload.Expertise != null)
        {
            staffAssignments.Add("ChuyenMon = @expertise");
            parameters.Add("expertise", payload.Expertise);
        }

        if (payload.YearsOfExperience.HasValue)
        {
            staffAssignments.Add("NamKinhNghiem = @yearsOfExperience");
            parameters.Add("yearsOfExperience", payload.YearsOfExperience.Value);
        }

        if (payload.Status != null)
        {
            var (userActive, staffReady) = GetStaffStatusUpdate(payload.Status);
            userAssignments.Add("TrangThaiHoatDong = @userActive");
            staffAssignments.Add("SanSangLamViec = @staffReady");
            parameters.Add("userActive", userActive);
            parameters.Add("staffReady", staffReady);
        }

        using var conn = CreateConnection();

        if (userAssignments.Count > 0)
        {
            var userSql = $"UPDATE dbo.NguoiDung SET {string.Join(", ", userAssignments)} WHERE MaNguoiDungClerk = @id;";
            await conn.ExecuteAsync(userSql, parameters);
        }

        if (staffAssignments.Count > 0)
        {
            var staffSql = $@"
                IF EXISTS (SELECT 1 FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id)
                BEGIN
                    UPDATE dbo.HoSoNhanVien SET {string.Join(", ", staffAssignments)} WHERE MaNhanVienClerk = @id;
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.HoSoNhanVien (MaNhanVienClerk, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
                    VALUES (@id, ISNULL(@expertise, N''), ISNULL(@yearsOfExperience, 0), 0, ISNULL(@staffReady, 1));
                END";
            await conn.ExecuteAsync(staffSql, parameters);
        }

        return await GetStaffByIdAsync(id);
    }

    private static StaffDto MapStaff(dynamic row)
    {
        var rating = row.DiemDanhGia is null ? 0m : Convert.ToDecimal(row.DiemDanhGia);
        var years = row.NamKinhNghiem is null ? 0 : Convert.ToInt32(row.NamKinhNghiem);

        return new StaffDto(
            Id: (string)(row.MaNguoiDungClerk ?? string.Empty),
            FullName: (string)(row.HoVaTen ?? string.Empty),
            Email: (string)(row.Email ?? string.Empty),
            Phone: (string)(row.SoDienThoai ?? string.Empty),
            Expertise: (string)(row.ChuyenMon ?? string.Empty),
            YearsOfExperience: years,
            Rating: rating,
            Status: ToStaffStatus((bool?)row.TrangThaiHoatDong, (bool?)row.SanSangLamViec),
            CreatedAt: (DateTime?)row.NgayTao
        );
    }

    /* =========================================================
       REPORTS
       ========================================================= */

    public async Task<OverviewDto> GetOverviewAsync()
    {
        const string sql = @"
            SELECT
              (SELECT COUNT(*) FROM dbo.NguoiDung) AS TotalUsers,
              (SELECT COUNT(*) FROM dbo.NguoiDung WHERE TrangThaiHoatDong = 1) AS ActiveUsers,
              (SELECT COUNT(*) FROM dbo.NguoiDung WHERE TrangThaiHoatDong = 0) AS LockedUsers,
              (SELECT COUNT(*) FROM dbo.NguoiDung WHERE LOWER(VaiTro) = 'staff') AS TotalStaff,
              (SELECT COUNT(*) FROM dbo.NguoiDung n
                LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
                WHERE LOWER(n.VaiTro) = 'staff' AND n.TrangThaiHoatDong = 1 AND ISNULL(h.SanSangLamViec, 1) = 1) AS ActiveStaff,
              (SELECT COUNT(*) FROM dbo.LichHen) AS TotalAppointments,
              (SELECT COUNT(*) FROM dbo.LichHen WHERE TrangThai = 'Pending') AS PendingAppointments,
              (SELECT COUNT(*) FROM dbo.LichHen WHERE TrangThai = 'Completed') AS CompletedAppointments,
              (SELECT COUNT(*) FROM dbo.LichHen WHERE TrangThai = 'Cancelled') AS CancelledAppointments,
              (SELECT ISNULL(SUM(TongTien), 0) FROM dbo.HoaDon WHERE TrangThaiThanhToan = 'Paid') AS TotalRevenue;";

        using var conn = CreateConnection();
        return await conn.QuerySingleAsync<OverviewDto>(sql);
    }

    public async Task<IEnumerable<DailyRevenueDto>> GetRevenueByDayAsync(int days = 14)
    {
        const string sql = @"
            SELECT
              CONVERT(varchar(10), CAST(NgayThanhToan AS date), 23) AS Day,
              SUM(TongTien) AS Revenue,
              COUNT(*) AS Invoices
            FROM dbo.HoaDon
            WHERE TrangThaiThanhToan = 'Paid'
              AND NgayThanhToan >= DATEADD(day, -@days, CAST(GETDATE() AS date))
            GROUP BY CAST(NgayThanhToan AS date)
            ORDER BY CAST(NgayThanhToan AS date);";

        using var conn = CreateConnection();
        return await conn.QueryAsync<DailyRevenueDto>(sql, new { days });
    }

    public async Task<IEnumerable<MonthlyRevenueDto>> GetRevenueByMonthAsync(int months = 6)
    {
        const string sql = @"
            SELECT
              FORMAT(NgayThanhToan, 'yyyy-MM') AS Month,
              SUM(TongTien) AS Revenue,
              COUNT(*) AS Invoices
            FROM dbo.HoaDon
            WHERE TrangThaiThanhToan = 'Paid'
              AND NgayThanhToan >= DATEADD(month, -@months, CAST(GETDATE() AS date))
            GROUP BY FORMAT(NgayThanhToan, 'yyyy-MM')
            ORDER BY FORMAT(NgayThanhToan, 'yyyy-MM');";

        using var conn = CreateConnection();
        return await conn.QueryAsync<MonthlyRevenueDto>(sql, new { months });
    }

    public async Task<RevenueBreakdownDto> GetRevenueBreakdownAsync()
    {
        const string sql = @"
            SELECT
              ISNULL((
                SELECT SUM(c.SoLuong * c.DonGia)
                FROM dbo.ChiTietHoaDon_SanPham c
                INNER JOIN dbo.HoaDon h ON h.MaHoaDon = c.MaHoaDon
                WHERE h.TrangThaiThanhToan = 'Paid'
              ), 0) AS ProductRevenue,
              ISNULL((
                SELECT SUM(h.TongTien)
                FROM dbo.HoaDon h
                WHERE h.TrangThaiThanhToan = 'Paid'
              ), 0) AS TotalRevenue;";

        using var conn = CreateConnection();
        var row = await conn.QuerySingleAsync<(decimal ProductRevenue, decimal TotalRevenue)>(sql);
        var serviceRevenue = Math.Max(row.TotalRevenue - row.ProductRevenue, 0);
        return new RevenueBreakdownDto(serviceRevenue, row.ProductRevenue, row.TotalRevenue);
    }

    public async Task<AppointmentStatusBreakdownDto> GetAppointmentStatusBreakdownAsync(int monthsBack = 1)
    {
        const string sql = @"
            SELECT TrangThai AS Status, COUNT(*) AS Total
            FROM dbo.LichHen
            WHERE NgayHen >= DATEADD(month, -@monthsBack, CAST(GETDATE() AS date))
            GROUP BY TrangThai;";

        using var conn = CreateConnection();
        var rows = await conn.QueryAsync<(string Status, int Total)>(sql, new { monthsBack });

        int pending = 0, completed = 0, cancelled = 0, inProgress = 0;
        foreach (var (status, total) in rows)
        {
            switch (status)
            {
                case "Pending": pending = total; break;
                case "Completed": completed = total; break;
                case "Cancelled": cancelled = total; break;
                case "InProgress": inProgress = total; break;
            }
        }
        return new AppointmentStatusBreakdownDto(pending, completed, cancelled, inProgress);
    }

    public async Task<IEnumerable<TopStaffDto>> GetTopStaffByRevenueAsync(int limit = 5)
    {
        const string sql = @"
            SELECT TOP (@limit)
              n.MaNguoiDungClerk AS Id,
              n.HoVaTen AS FullName,
              ISNULL(h.ChuyenMon, '') AS Expertise,
              COUNT(DISTINCT lh.MaLichHen) AS CompletedAppointments,
              ISNULL(SUM(hd.TongTien), 0) AS TotalRevenue
            FROM dbo.NguoiDung n
            LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
            LEFT JOIN dbo.LichHen lh
              ON lh.MaNhanVienClerk = n.MaNguoiDungClerk AND lh.TrangThai = 'Completed'
            LEFT JOIN dbo.HoaDon hd
              ON hd.MaLichHen = lh.MaLichHen AND hd.TrangThaiThanhToan = 'Paid'
            WHERE LOWER(n.VaiTro) = 'staff'
            GROUP BY n.MaNguoiDungClerk, n.HoVaTen, h.ChuyenMon
            ORDER BY TotalRevenue DESC, CompletedAppointments DESC;";

        using var conn = CreateConnection();
        return await conn.QueryAsync<TopStaffDto>(sql, new { limit });
    }

    public async Task<IEnumerable<TopServiceDto>> GetTopServicesAsync(int limit = 5)
    {
        const string sql = @"
            SELECT TOP (@limit)
              d.MaDichVu AS Id,
              ISNULL(d.TenDichVu, '') AS Name,
              ISNULL(d.GiaTien, 0) AS Price,
              COUNT(lh.MaLichHen) AS BookingCount
            FROM dbo.DichVu d
            LEFT JOIN dbo.LichHen lh ON lh.MaDichVu = d.MaDichVu
            GROUP BY d.MaDichVu, d.TenDichVu, d.GiaTien
            ORDER BY BookingCount DESC, Name;";

        using var conn = CreateConnection();
        return await conn.QueryAsync<TopServiceDto>(sql, new { limit });
    }

    public async Task<IEnumerable<TopProductDto>> GetTopProductsAsync(int limit = 5)
    {
        const string sql = @"
            SELECT TOP (@limit)
              s.MaSanPham AS Id,
              ISNULL(s.TenSanPham, '') AS Name,
              ISNULL(s.LoaiSanPham, '') AS Category,
              ISNULL(s.SoLuongTon, 0) AS Stock,
              ISNULL(SUM(c.SoLuong), 0) AS TotalSold,
              ISNULL(SUM(c.SoLuong * c.DonGia), 0) AS TotalRevenue
            FROM dbo.SanPham s
            LEFT JOIN dbo.ChiTietHoaDon_SanPham c ON c.MaSanPham = s.MaSanPham
            LEFT JOIN dbo.HoaDon h ON h.MaHoaDon = c.MaHoaDon AND h.TrangThaiThanhToan = 'Paid'
            GROUP BY s.MaSanPham, s.TenSanPham, s.LoaiSanPham, s.SoLuongTon
            ORDER BY TotalSold DESC, Name;";

        using var conn = CreateConnection();
        return await conn.QueryAsync<TopProductDto>(sql, new { limit });
    }
}

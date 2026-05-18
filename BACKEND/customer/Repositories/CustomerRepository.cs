using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using MyPuppy.Customer.Models;

namespace MyPuppy.Customer.Repositories;

public class CustomerRepository
{
    private readonly string _connectionString;

    public CustomerRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("PetHealth")
            ?? throw new InvalidOperationException("Missing connection string PetHealth.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<bool> CanConnectAsync()
    {
        using var conn = CreateConnection();
        var value = await conn.ExecuteScalarAsync<int>("SELECT 1;");
        return value == 1;
    }

    public async Task<IEnumerable<CustomerServiceDto>> GetServicesAsync()
    {
        const string sql = @"
            WITH ServiceStats AS (
                SELECT
                    d.MaDichVu AS Id,
                    ISNULL(d.TenDichVu, '') AS Name,
                    ISNULL(d.MoTa, '') AS Description,
                    ISNULL(d.GiaTien, 0) AS Price,
                    ISNULL(d.ThoiGianThucHien, 60) AS Duration,
                    COUNT(lh.MaLichHen) AS BookingCount
                FROM dbo.DichVu d
                LEFT JOIN dbo.LichHen lh ON lh.MaDichVu = d.MaDichVu
                GROUP BY d.MaDichVu, d.TenDichVu, d.MoTa, d.GiaTien, d.ThoiGianThucHien
            )
            SELECT
                Id, Name, Description, Price, Duration, BookingCount,
                CAST(ROW_NUMBER() OVER (ORDER BY BookingCount DESC, Name) AS INT) AS Ranking
            FROM ServiceStats
            ORDER BY Ranking;";

        using var conn = CreateConnection();
        return await conn.QueryAsync<CustomerServiceDto>(sql);
    }

    public async Task<IEnumerable<CustomerProductDto>> GetProductsAsync()
    {
        var columns = await GetColumnsAsync("SanPham");
        RequireColumns(columns, "SanPham", "MaSanPham", "TenSanPham");

        var categoryExpr = columns.Contains("LoaiSanPham") ? "ISNULL(s.LoaiSanPham, '')" : "''";
        var descriptionExpr = columns.Contains("MoTa") ? "ISNULL(s.MoTa, '')" : categoryExpr;
        var priceExpr = FirstExisting(columns, "GiaBan", "GiaTien", "DonGia") is { } priceColumn
            ? $"ISNULL(s.{priceColumn}, 0)"
            : "CAST(0 AS decimal(18,2))";
        var stockExpr = columns.Contains("SoLuongTon") ? "ISNULL(s.SoLuongTon, 0)" : "0";

        var sql = $@"
            SELECT
                s.MaSanPham AS Id,
                ISNULL(s.TenSanPham, '') AS Name,
                {categoryExpr} AS Category,
                {descriptionExpr} AS Description,
                {priceExpr} AS Price,
                {stockExpr} AS Stock
            FROM dbo.SanPham s
            ORDER BY Name;";

        using var conn = CreateConnection();
        return await conn.QueryAsync<CustomerProductDto>(sql);
    }

    public async Task<CustomerProfileDto?> GetProfileAsync(string clerkUserId)
    {
        const string sql = @"
            SELECT MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, DiaChi, GioiTinh, VaiTro, TrangThaiHoatDong, NgayTao
            FROM dbo.NguoiDung
            WHERE MaNguoiDungClerk = @clerkUserId;";

        using var conn = CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync(sql, new { clerkUserId });
        return row == null ? null : MapProfile(row);
    }

    public async Task<CustomerProfileDto?> UpsertProfileAsync(UpsertCustomerProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ClerkUserId))
        {
            throw new CustomerApiException(400, "Missing Clerk user id.");
        }

        const string sql = @"
            MERGE dbo.NguoiDung AS target
            USING (SELECT @id AS MaNguoiDungClerk) AS src
                ON target.MaNguoiDungClerk = src.MaNguoiDungClerk
            WHEN MATCHED THEN
                UPDATE SET
                    HoVaTen = @fullName,
                    Email = @email,
                    SoDienThoai = @phone,
                    DiaChi = @address,
                    GioiTinh = @gender,
                    VaiTro = 'Customer',
                    TrangThaiHoatDong = 1
            WHEN NOT MATCHED THEN
                INSERT (MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, DiaChi, GioiTinh, VaiTro, TrangThaiHoatDong, NgayTao)
                VALUES (@id, @fullName, @email, @phone, @address, @gender, 'Customer', 1, SYSUTCDATETIME());";

        using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new
        {
            id = request.ClerkUserId.Trim(),
            fullName = request.FullName?.Trim() ?? string.Empty,
            email = request.Email?.Trim() ?? string.Empty,
            phone = request.Phone?.Trim() ?? string.Empty,
            address = request.Address?.Trim() ?? string.Empty,
            gender = request.Gender?.Trim() ?? string.Empty
        });

        return await GetProfileAsync(request.ClerkUserId.Trim());
    }

    public async Task<IEnumerable<CustomerBookingDto>> GetBookingsAsync(string? customerId)
    {
        var columns = await GetColumnsAsync("LichHen");
        RequireColumns(columns, "LichHen", "MaLichHen", "MaDichVu");

        var customerColumn = FirstExisting(columns, "MaKhachHangClerk", "MaNguoiDungClerk", "MaKhachHang");
        var dateExpr = columns.Contains("NgayHen") ? "lh.NgayHen" : "NULL";
        var timeExpr = FirstExisting(columns, "GioHen", "KhungGio", "ThoiGianHen") is { } timeColumn ? $"lh.{timeColumn}" : "NULL";
        var statusExpr = columns.Contains("TrangThai") ? "ISNULL(lh.TrangThai, 'Pending')" : "'Pending'";
        var totalExpr = columns.Contains("TongTien") ? "ISNULL(lh.TongTien, 0)" : "CAST(0 AS decimal(18,2))";
        var notesExpr = columns.Contains("GhiChu") ? "ISNULL(lh.GhiChu, '')" : "''";
        var petNameExpr = FirstExisting(columns, "TenThuCung", "TenBe") is { } petNameColumn ? $"ISNULL(lh.{petNameColumn}, '')" : "''";
        var petTypeExpr = FirstExisting(columns, "LoaiThuCung", "LoaiPet") is { } petTypeColumn ? $"ISNULL(lh.{petTypeColumn}, '')" : "''";
        var customerExpr = customerColumn is null ? "''" : $"CAST(lh.{customerColumn} AS nvarchar(120))";
        var whereSql = !string.IsNullOrWhiteSpace(customerId) && customerColumn is not null
            ? $"WHERE CAST(lh.{customerColumn} AS nvarchar(120)) = @customerId"
            : string.Empty;

        var sql = $@"
            SELECT
                lh.MaLichHen AS Id,
                {customerExpr} AS CustomerId,
                lh.MaDichVu AS ServiceId,
                ISNULL(d.TenDichVu, '') AS ServiceName,
                {petNameExpr} AS PetName,
                {petTypeExpr} AS PetType,
                {dateExpr} AS BookingDate,
                {timeExpr} AS BookingTime,
                {statusExpr} AS Status,
                {totalExpr} AS TotalAmount,
                {notesExpr} AS Notes
            FROM dbo.LichHen lh
            LEFT JOIN dbo.DichVu d ON d.MaDichVu = lh.MaDichVu
            {whereSql}
            ORDER BY lh.MaLichHen DESC;";

        using var conn = CreateConnection();
        var rows = await conn.QueryAsync(sql, new { customerId });
        return rows.Select(MapBooking).ToList();
    }

    public async Task<CustomerBookingDto> CreateBookingAsync(CreateBookingRequest request)
    {
        if (request.ServiceId <= 0)
        {
            throw new CustomerApiException(400, "ServiceId must be greater than 0.");
        }

        var columns = await GetColumnsAsync("LichHen");
        RequireColumns(columns, "LichHen", "MaDichVu");

        var insertColumns = new List<string>();
        var insertValues = new List<string>();
        var parameters = new DynamicParameters();

        void Add(string column, string parameterName, object? value)
        {
            insertColumns.Add(column);
            insertValues.Add($"@{parameterName}");
            parameters.Add(parameterName, value);
        }

        if (columns.Contains("MaKhachHangClerk") && !string.IsNullOrWhiteSpace(request.CustomerId))
        {
            Add("MaKhachHangClerk", "customerId", request.CustomerId);
        }
        else if (columns.Contains("MaNguoiDungClerk") && !string.IsNullOrWhiteSpace(request.CustomerId))
        {
            Add("MaNguoiDungClerk", "customerId", request.CustomerId);
        }
        else if (columns.Contains("MaKhachHang")
            && int.TryParse(request.CustomerId, out var numericCustomerId))
        {
            Add("MaKhachHang", "customerId", numericCustomerId);
        }

        Add("MaDichVu", "serviceId", request.ServiceId);

        if (columns.Contains("NgayHen"))
        {
            Add("NgayHen", "bookingDate", request.BookingDate.ToDateTime(TimeOnly.MinValue));
        }

        var timeColumn = FirstExisting(columns, "GioHen", "KhungGio", "ThoiGianHen");
        if (timeColumn is not null)
        {
            Add(timeColumn, "bookingTime", request.BookingTime.ToTimeSpan());
        }

        if (columns.Contains("TrangThai"))
        {
            Add("TrangThai", "status", "Pending");
        }

        if (columns.Contains("TongTien"))
        {
            Add("TongTien", "totalAmount", request.TotalAmount);
        }

        if (columns.Contains("TenThuCung") && !string.IsNullOrWhiteSpace(request.PetName))
        {
            Add("TenThuCung", "petName", request.PetName);
        }

        if (columns.Contains("LoaiThuCung") && !string.IsNullOrWhiteSpace(request.PetType))
        {
            Add("LoaiThuCung", "petType", request.PetType);
        }

        if (columns.Contains("GhiChu"))
        {
            var addonNotes = request.Addons is { Count: > 0 }
                ? $" | Dich vu them: {string.Join(", ", request.Addons)}"
                : string.Empty;
            Add("GhiChu", "notes", $"{request.Notes ?? string.Empty}{addonNotes}".Trim());
        }

        if (columns.Contains("NgayTao"))
        {
            Add("NgayTao", "createdAt", DateTime.UtcNow);
        }

        if (!columns.Contains("NgayHen"))
        {
            throw new CustomerApiException(400, "dbo.LichHen is missing NgayHen, cannot create booking from frontend.");
        }

        var outputSql = columns.Contains("MaLichHen")
            ? "OUTPUT INSERTED.MaLichHen"
            : string.Empty;
        var identitySql = columns.Contains("MaLichHen")
            ? string.Empty
            : " SELECT CAST(SCOPE_IDENTITY() AS int);";

        var sql = $@"
            INSERT INTO dbo.LichHen ({string.Join(", ", insertColumns)})
            {outputSql}
            VALUES ({string.Join(", ", insertValues)});
            {identitySql}";

        using var conn = CreateConnection();
        var insertedId = await conn.ExecuteScalarAsync<object?>(sql, parameters);
        var id = insertedId == null || insertedId == DBNull.Value ? 0 : Convert.ToInt32(insertedId);

        return new CustomerBookingDto(
            Id: id,
            CustomerId: request.CustomerId ?? string.Empty,
            ServiceId: request.ServiceId,
            ServiceName: string.Empty,
            PetName: request.PetName ?? string.Empty,
            PetType: request.PetType ?? string.Empty,
            BookingDate: request.BookingDate,
            BookingTime: request.BookingTime,
            Status: "Pending",
            TotalAmount: request.TotalAmount,
            Notes: request.Notes ?? string.Empty
        );
    }

    private async Task<HashSet<string>> GetColumnsAsync(string tableName)
    {
        const string sql = @"
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @tableName;";

        using var conn = CreateConnection();
        var columns = await conn.QueryAsync<string>(sql, new { tableName });
        return columns.ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static void RequireColumns(HashSet<string> columns, string tableName, params string[] required)
    {
        var missing = required.Where(column => !columns.Contains(column)).ToArray();
        if (missing.Length > 0)
        {
            throw new CustomerApiException(500, $"dbo.{tableName} is missing required columns.", new { missing });
        }
    }

    private static string? FirstExisting(HashSet<string> columns, params string[] candidates)
        => candidates.FirstOrDefault(columns.Contains);

    private static CustomerProfileDto MapProfile(dynamic row)
    {
        return new CustomerProfileDto(
            Id: (string)(row.MaNguoiDungClerk ?? string.Empty),
            FullName: (string)(row.HoVaTen ?? string.Empty),
            Email: (string)(row.Email ?? string.Empty),
            Phone: (string)(row.SoDienThoai ?? string.Empty),
            Address: (string)(row.DiaChi ?? string.Empty),
            Gender: (string)(row.GioiTinh ?? string.Empty),
            Role: ((string)(row.VaiTro ?? "Customer")).ToLowerInvariant(),
            Status: row.TrangThaiHoatDong == true ? "active" : "locked",
            CreatedAt: (DateTime?)row.NgayTao
        );
    }

    private static CustomerBookingDto MapBooking(dynamic row)
    {
        var values = (IDictionary<string, object>)row;
        return new CustomerBookingDto(
            Id: ToInt(values["Id"]),
            CustomerId: ToStringValue(values["CustomerId"]),
            ServiceId: ToInt(values["ServiceId"]),
            ServiceName: ToStringValue(values["ServiceName"]),
            PetName: ToStringValue(values["PetName"]),
            PetType: ToStringValue(values["PetType"]),
            BookingDate: ToDateOnly(values["BookingDate"]),
            BookingTime: ToTimeOnly(values["BookingTime"]),
            Status: ToStringValue(values["Status"]),
            TotalAmount: ToDecimal(values["TotalAmount"]),
            Notes: ToStringValue(values["Notes"])
        );
    }

    private static int ToInt(object? value)
        => value == null || value == DBNull.Value ? 0 : Convert.ToInt32(value);

    private static decimal ToDecimal(object? value)
        => value == null || value == DBNull.Value ? 0 : Convert.ToDecimal(value);

    private static string ToStringValue(object? value)
        => value == null || value == DBNull.Value ? string.Empty : Convert.ToString(value) ?? string.Empty;

    private static DateOnly? ToDateOnly(object? value)
    {
        if (value == null || value == DBNull.Value) return null;
        if (value is DateOnly dateOnly) return dateOnly;
        if (value is DateTime dateTime) return DateOnly.FromDateTime(dateTime);
        return DateOnly.TryParse(Convert.ToString(value), out var parsed) ? parsed : null;
    }

    private static TimeOnly? ToTimeOnly(object? value)
    {
        if (value == null || value == DBNull.Value) return null;
        if (value is TimeOnly timeOnly) return timeOnly;
        if (value is TimeSpan timeSpan) return TimeOnly.FromTimeSpan(timeSpan);
        if (value is DateTime dateTime) return TimeOnly.FromDateTime(dateTime);
        return TimeOnly.TryParse(Convert.ToString(value), out var parsed) ? parsed : null;
    }
}

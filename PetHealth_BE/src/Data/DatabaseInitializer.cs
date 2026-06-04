using Microsoft.EntityFrameworkCore;
using PetHealth_BE.src.Models;
using PetHealth_BE.src.Services;

namespace PetHealth_BE.src.Data;

public static class DatabaseInitializer
{
    public static async Task EnsureDefaultAccountsAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<PasswordHasherService>();

        await EnsureLegacyColumnNamesAsync(dbContext);
        await EnsureAccountSecurityAsync(dbContext);
        await EnsureMultiServiceBookingsAsync(dbContext);
        await EnsurePromotionDiscountColumnsAsync(dbContext);
        await EnsureDepositReceiptColumnsAsync(dbContext);
        await EnsureClinicalRecordsAsync(dbContext);
        await EnsureNotificationsAsync(dbContext);
        await EnsureVietnameseDisplayTextAsync(dbContext);

        await EnsureAccountAsync(
            dbContext,
            passwordHasher,
            "local_admin",
            "Quản trị viên",
            "admin@pethealth.local",
            "Admin");

        await EnsureAccountAsync(
            dbContext,
            passwordHasher,
            "local_staff",
            "Nhân viên PetHealth",
            "staff@pethealth.local",
            "Staff");

        await EnsureAccountAsync(
            dbContext,
            passwordHasher,
            "local_customer",
            "Khách hàng PetHealth",
            "customer@pethealth.local",
            "Customer");

        await dbContext.SaveChangesAsync();
    }

    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<PasswordHasherService>();

        await EnsureLegacyColumnNamesAsync(dbContext);
        await dbContext.Database.EnsureCreatedAsync();
        await EnsureAccountSecurityAsync(dbContext);
        await EnsureMultiServiceBookingsAsync(dbContext);
        await EnsurePromotionDiscountColumnsAsync(dbContext);
        await EnsureDepositReceiptColumnsAsync(dbContext);
        await EnsureClinicalRecordsAsync(dbContext);
        await EnsureNotificationsAsync(dbContext);
        await EnsureVietnameseDisplayTextAsync(dbContext);

        if (!await dbContext.DichVus.AnyAsync())
        {
            dbContext.DichVus.AddRange(
                new DichVu
                {
                    TenDichVu = "Khám tổng quát",
                    MoTa = "Khám sức khỏe tổng thể và tư vấn phác đồ chăm sóc.",
                    GiaTien = 180000,
                    ThoiGianThucHien = 30,
                    TrangThaiHoatDong = true
                },
                new DichVu
                {
                    TenDichVu = "Tiêm phòng định kỳ",
                    MoTa = "Tiêm phòng cho chó và mèo theo lịch trình định kỳ.",
                    GiaTien = 250000,
                    ThoiGianThucHien = 20,
                    TrangThaiHoatDong = true
                },
                new DichVu
                {
                    TenDichVu = "Spa và cắt tỉa lông",
                    MoTa = "Làm sạch, cắt tỉa, sấy khô và chăm sóc lông cơ bản.",
                    GiaTien = 320000,
                    ThoiGianThucHien = 60,
                    TrangThaiHoatDong = true
                });
        }

        if (!await dbContext.NguoiDungs.AnyAsync())
        {
            var user = new NguoiDung
            {
                MaNguoiDung = "local_seed_001",
                HoVaTen = "Nguyễn Thu Hà",
                Email = "customer@pethealth.local",
                SoDienThoai = "0909000111",
                GioiTinh = string.Empty,
                DiaChi = string.Empty,
                VaiTro = "Customer",
                TrangThaiHoatDong = true,
                NgayTao = DateTime.UtcNow
            };

            dbContext.NguoiDungs.Add(user);
            await dbContext.SaveChangesAsync();

            var pet = new ThuCung
            {
                MaNguoiDung = user.MaNguoiDung,
                TenThuCung = "Bún",
                LoaiThuCung = "Chó",
                Giong = "Poodle",
                GioiTinh = "Đực",
                NgaySinh = new DateTime(2023, 6, 12),
                CanNang = 4.8m,
                GhiChu = "Dễ nhạy cảm với âm thanh lớn."
            };

            dbContext.ThuCungs.Add(pet);
            await dbContext.SaveChangesAsync();

            var firstService = await dbContext.DichVus.OrderBy(x => x.MaDichVu).FirstAsync();
            dbContext.LichHens.Add(new LichHen
            {
                MaNguoiDung = user.MaNguoiDung,
                MaThuCung = pet.MaThuCung,
                MaDichVu = firstService.MaDichVu,
                NgayHen = DateTime.Today.AddDays(1),
                GioHen = new TimeOnly(9, 0),
                TrangThai = "Confirmed",
                TongTien = firstService.GiaTien,
                GhiChu = "Khám định kỳ đầu tháng.",
                CreatedAt = DateTime.UtcNow
            });
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureAccountAsync(
        AppDbContext dbContext,
        PasswordHasherService passwordHasher,
        string userId,
        string fullName,
        string email,
        string role)
    {
        const string defaultPassword = "123456";
        var user = await dbContext.NguoiDungs.FirstOrDefaultAsync(x => x.Email == email);

        if (user is null)
        {
            dbContext.NguoiDungs.Add(new NguoiDung
            {
                MaNguoiDung = userId,
                HoVaTen = fullName,
                Email = email,
                SoDienThoai = string.Empty,
                GioiTinh = string.Empty,
                DiaChi = string.Empty,
                VaiTro = role,
                TrangThaiHoatDong = true,
                NgayTao = DateTime.UtcNow,
                PasswordHash = passwordHasher.Hash(defaultPassword),
                AuthProvider = "Local",
                EmailDaXacMinh = true
            });

            return;
        }

        user.HoVaTen = string.IsNullOrWhiteSpace(user.HoVaTen) ? fullName : user.HoVaTen;
        user.VaiTro = role;
        user.TrangThaiHoatDong = true;
        user.AuthProvider = string.IsNullOrWhiteSpace(user.GoogleSubject) ? "Local" : "Local,Google";
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            user.PasswordHash = passwordHasher.Hash(defaultPassword);
        }
        user.EmailDaXacMinh = true;
    }

    private static async Task EnsureLegacyColumnNamesAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        var suffix = "Cl" + "erk";
        var columnRenames = new (string TableName, string OldColumnName, string NewColumnName)[]
        {
            ("NguoiDung", $"MaNguoiDung{suffix}", "MaNguoiDung"),
            ("ThuCung", $"MaChuNhan{suffix}", "MaChuNhan"),
            ("LichHen", $"MaKhachHang{suffix}", "MaKhachHang"),
            ("LichHen", $"MaNhanVien{suffix}", "MaNhanVien"),
            ("HoSoNhanVien", $"MaNhanVien{suffix}", "MaNhanVien"),
            ("DanhGiaDichVu", $"MaKhachHang{suffix}", "MaKhachHang"),
            ("HoaDon", $"MaKhachHang{suffix}", "MaKhachHang"),
            ("PhieuUuDaiKhachHang", $"MaKhachHang{suffix}", "MaKhachHang"),
            ("CaLamViec", $"MaNhanVien{suffix}", "MaNhanVien"),
            ("DatCocThanhToan", $"MaKhachHang{suffix}", "MaKhachHang"),
            ("NhacLichTaiKham", $"MaKhachHang{suffix}", "MaKhachHang")
        };

        foreach (var rename in columnRenames)
        {
            await RenameColumnIfExistsAsync(dbContext, rename.TableName, rename.OldColumnName, rename.NewColumnName);
        }
    }

    private static async Task RenameColumnIfExistsAsync(
        AppDbContext dbContext,
        string tableName,
        string oldColumnName,
        string newColumnName)
    {
        const string sql = """
            DECLARE @TableName sysname = @TableNameParam;
            DECLARE @OldColumnName sysname = @OldColumnNameParam;
            DECLARE @NewColumnName sysname = @NewColumnNameParam;
            DECLARE @FullTableName nvarchar(300) = N'dbo.' + QUOTENAME(@TableName);
            DECLARE @FullOldName nvarchar(400) = N'dbo.' + QUOTENAME(@TableName) + N'.' + QUOTENAME(@OldColumnName);

            IF COL_LENGTH(@FullTableName, @OldColumnName) IS NOT NULL
               AND COL_LENGTH(@FullTableName, @NewColumnName) IS NULL
            BEGIN
                EXEC sp_rename @FullOldName, @NewColumnName, 'COLUMN';
            END
            """;

        await dbContext.Database.ExecuteSqlRawAsync(
            sql,
            new Microsoft.Data.SqlClient.SqlParameter("@TableNameParam", tableName),
            new Microsoft.Data.SqlClient.SqlParameter("@OldColumnNameParam", oldColumnName),
            new Microsoft.Data.SqlClient.SqlParameter("@NewColumnNameParam", newColumnName));
    }

    private static async Task EnsureMultiServiceBookingsAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        const string sql = """
            IF OBJECT_ID(N'dbo.LichHenDichVu', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.LichHenDichVu
                (
                    MaLichHen int NOT NULL,
                    MaDichVu int NOT NULL,
                    CONSTRAINT PK_LichHenDichVu PRIMARY KEY (MaLichHen, MaDichVu),
                    CONSTRAINT FK_LichHenDichVu_LichHen FOREIGN KEY (MaLichHen) REFERENCES dbo.LichHen(MaLichHen) ON DELETE CASCADE,
                    CONSTRAINT FK_LichHenDichVu_DichVu FOREIGN KEY (MaDichVu) REFERENCES dbo.DichVu(MaDichVu)
                );
            END;

            INSERT INTO dbo.LichHenDichVu (MaLichHen, MaDichVu)
            SELECT lh.MaLichHen, lh.MaDichVu
            FROM dbo.LichHen lh
            WHERE NOT EXISTS
            (
                SELECT 1
                FROM dbo.LichHenDichVu lhdv
                WHERE lhdv.MaLichHen = lh.MaLichHen
                  AND lhdv.MaDichVu = lh.MaDichVu
            );
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task EnsureAccountSecurityAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        const string sql = """
            IF COL_LENGTH(N'dbo.NguoiDung', N'EmailDaXacMinh') IS NULL
            BEGIN
                ALTER TABLE dbo.NguoiDung
                ADD EmailDaXacMinh bit NOT NULL
                    CONSTRAINT DF_NguoiDung_EmailDaXacMinh DEFAULT (1);
            END;

            IF OBJECT_ID(N'dbo.TaiKhoanToken', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.TaiKhoanToken
                (
                    MaToken int IDENTITY(1, 1) NOT NULL PRIMARY KEY,
                    MaNguoiDung nvarchar(50) NOT NULL,
                    LoaiToken nvarchar(30) NOT NULL,
                    TokenHash nvarchar(128) NOT NULL,
                    HanSuDung datetime2 NOT NULL,
                    DaSuDung bit NOT NULL CONSTRAINT DF_TaiKhoanToken_DaSuDung DEFAULT (0),
                    NgayTao datetime2 NOT NULL CONSTRAINT DF_TaiKhoanToken_NgayTao DEFAULT (SYSUTCDATETIME())
                );

                CREATE INDEX IX_TaiKhoanToken_Lookup
                    ON dbo.TaiKhoanToken (LoaiToken, TokenHash, DaSuDung, HanSuDung);
            END;
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task EnsureVietnameseDisplayTextAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        const string sql = """
            IF OBJECT_ID(N'dbo.NhacLichTaiKham', N'U') IS NOT NULL
            BEGIN
                UPDATE dbo.NhacLichTaiKham
                SET NoiDung = CASE NoiDung
                    WHEN N'Thu cung duoi 1 tuoi, nen tai kham sau 3 tuan.'
                        THEN N'Thú cưng dưới 1 tuổi, nên tái khám sau 3 tuần.'
                    WHEN N'Thu cung tren 1 tuoi, nen tai kham sau 6 thang.'
                        THEN N'Thú cưng trên 1 tuổi, nên tái khám sau 6 tháng.'
                    WHEN N'Dich vu cham soc/spa/cat tia nen hen lai sau 3 thang.'
                        THEN N'Dịch vụ chăm sóc/spa/cắt tỉa nên hẹn lại sau 3 tháng.'
                    ELSE NoiDung
                END
                WHERE NoiDung IN
                (
                    N'Thu cung duoi 1 tuoi, nen tai kham sau 3 tuan.',
                    N'Thu cung tren 1 tuoi, nen tai kham sau 6 thang.',
                    N'Dich vu cham soc/spa/cat tia nen hen lai sau 3 thang.'
                );
            END;

            IF OBJECT_ID(N'dbo.DichVu', N'U') IS NOT NULL
            BEGIN
                UPDATE dbo.DichVu SET TenDichVu = N'Khám tổng quát' WHERE TenDichVu = N'Kham tong quat';
                UPDATE dbo.DichVu SET TenDichVu = N'Tiêm phòng định kỳ' WHERE TenDichVu = N'Tiem phong dinh ky';
                UPDATE dbo.DichVu SET TenDichVu = N'Spa và cắt tỉa lông' WHERE TenDichVu = N'Spa va cat tia long';
            END;
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }
    private static async Task EnsurePromotionDiscountColumnsAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        const string sql = """
            IF OBJECT_ID(N'dbo.ChuongTrinhUuDai', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH(N'dbo.ChuongTrinhUuDai', N'LoaiGiamGia') IS NULL
                BEGIN
                    ALTER TABLE dbo.ChuongTrinhUuDai
                    ADD LoaiGiamGia nvarchar(20) NOT NULL
                        CONSTRAINT DF_ChuongTrinhUuDai_LoaiGiamGia DEFAULT (N'Full');
                END;

                IF COL_LENGTH(N'dbo.ChuongTrinhUuDai', N'GiaTriGiam') IS NULL
                BEGIN
                    ALTER TABLE dbo.ChuongTrinhUuDai
                    ADD GiaTriGiam decimal(18, 2) NOT NULL
                        CONSTRAINT DF_ChuongTrinhUuDai_GiaTriGiam DEFAULT (0);
                END;

                EXEC(N'
                    UPDATE dbo.ChuongTrinhUuDai
                    SET LoaiGiamGia = N''Full'',
                        GiaTriGiam = 0
                    WHERE LoaiGiamGia IS NULL
                       OR LTRIM(RTRIM(LoaiGiamGia)) = N'''';
                ');
            END;
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task EnsureDepositReceiptColumnsAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        const string sql = """
            IF OBJECT_ID(N'dbo.DatCocThanhToan', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH(N'dbo.DatCocThanhToan', N'BienLaiUrl') IS NULL
                    ALTER TABLE dbo.DatCocThanhToan ADD BienLaiUrl nvarchar(1000) NULL;
                IF COL_LENGTH(N'dbo.DatCocThanhToan', N'GhiChuKhachHang') IS NULL
                    ALTER TABLE dbo.DatCocThanhToan ADD GhiChuKhachHang nvarchar(500) NULL;
                IF COL_LENGTH(N'dbo.DatCocThanhToan', N'MaNguoiDuyet') IS NULL
                    ALTER TABLE dbo.DatCocThanhToan ADD MaNguoiDuyet nvarchar(100) NULL;
                IF COL_LENGTH(N'dbo.DatCocThanhToan', N'NgayDuyet') IS NULL
                    ALTER TABLE dbo.DatCocThanhToan ADD NgayDuyet datetime2 NULL;
                IF COL_LENGTH(N'dbo.DatCocThanhToan', N'LyDoTuChoi') IS NULL
                    ALTER TABLE dbo.DatCocThanhToan ADD LyDoTuChoi nvarchar(500) NULL;
            END
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task EnsureClinicalRecordsAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        const string sql = """
            IF OBJECT_ID(N'dbo.HoSoBenhAn', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.HoSoBenhAn
                (
                    MaHoSo int IDENTITY(1,1) PRIMARY KEY,
                    MaLichHen int NOT NULL UNIQUE,
                    MaThuCung int NOT NULL,
                    MaNhanVien nvarchar(100) NULL,
                    ChanDoan nvarchar(1000) NOT NULL,
                    DieuTri nvarchar(2000) NULL,
                    Thuoc nvarchar(2000) NULL,
                    TiemChung nvarchar(1000) NULL,
                    GhiChu nvarchar(2000) NULL,
                    NgayCapNhat datetime2 NOT NULL CONSTRAINT DF_HoSoBenhAn_NgayCapNhat DEFAULT GETDATE()
                );
            END
            """;
        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task EnsureNotificationsAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync()) return;
        const string sql = """
            IF OBJECT_ID(N'dbo.ThongBaoNguoiDung', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ThongBaoNguoiDung
                (
                    MaThongBao int IDENTITY(1,1) PRIMARY KEY,
                    MaNguoiDung nvarchar(100) NOT NULL,
                    TieuDe nvarchar(300) NOT NULL,
                    NoiDung nvarchar(1000) NOT NULL,
                    DuongDan nvarchar(500) NULL,
                    DaDoc bit NOT NULL CONSTRAINT DF_ThongBaoNguoiDung_DaDoc DEFAULT 0,
                    NgayTao datetime2 NOT NULL CONSTRAINT DF_ThongBaoNguoiDung_NgayTao DEFAULT GETDATE()
                );
                CREATE INDEX IX_ThongBaoNguoiDung_User ON dbo.ThongBaoNguoiDung(MaNguoiDung, DaDoc, NgayTao);
            END;

            EXEC(N'
            CREATE OR ALTER TRIGGER dbo.TR_LichHen_ThongBao
            ON dbo.LichHen AFTER INSERT, UPDATE
            AS
            BEGIN
                SET NOCOUNT ON;
                INSERT INTO dbo.ThongBaoNguoiDung (MaNguoiDung, TieuDe, NoiDung, DuongDan)
                SELECT i.MaKhachHang,
                       CASE WHEN d.MaLichHen IS NULL THEN N''Đã tạo lịch hẹn'' ELSE N''Lịch hẹn đã cập nhật'' END,
                       CONCAT(N''Lịch hẹn #'', i.MaLichHen, N'' hiện có trạng thái '', i.TrangThai, N''.''),
                       N''/appointments''
                FROM inserted i
                LEFT JOIN deleted d ON d.MaLichHen = i.MaLichHen
                WHERE d.MaLichHen IS NULL OR ISNULL(d.TrangThai, N'''') <> ISNULL(i.TrangThai, N'''');
            END');
            """;
        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }
}

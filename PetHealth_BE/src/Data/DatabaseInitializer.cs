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

        await dbContext.Database.MigrateAsync();
        await EnsureLegacyColumnNamesAsync(dbContext);
        await EnsureAccountSecurityAsync(dbContext);
        await EnsureMultiServiceBookingsAsync(dbContext);
        await EnsureClinicalRecordsAsync(dbContext);
        await EnsureNotificationsAsync(dbContext);
        await EnsurePetSoftDeleteColumnAsync(dbContext);
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

        await dbContext.Database.MigrateAsync();
        await EnsureLegacyColumnNamesAsync(dbContext);
        await EnsureAccountSecurityAsync(dbContext);
        await EnsureMultiServiceBookingsAsync(dbContext);
        await EnsureClinicalRecordsAsync(dbContext);
        await EnsureNotificationsAsync(dbContext);
        await EnsurePetSoftDeleteColumnAsync(dbContext);
        await EnsureVietnameseDisplayTextAsync(dbContext);

        await EnsureAccountAsync(dbContext, passwordHasher, "local_admin", "Quản trị viên", "admin@pethealth.local", "Admin");
        await EnsureAccountAsync(dbContext, passwordHasher, "local_staff", "Nhân viên PetHealth", "staff@pethealth.local", "Staff");
        await EnsureAccountAsync(dbContext, passwordHasher, "local_customer", "Khách hàng PetHealth", "customer@pethealth.local", "Customer");
        await dbContext.SaveChangesAsync();

        await SeedServicesAsync(dbContext);
        await SeedStaffAsync(dbContext);
        await SeedCustomerJourneyAsync(dbContext);
        await SeedNotificationsAsync(dbContext);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedServicesAsync(AppDbContext dbContext)
    {
        var services = new[]
        {
            new DichVu
            {
                TenDichVu = "Khám tổng quát",
                MoTa = "Kiểm tra mắt, tai, da lông, nghe tim phổi và tư vấn chăm sóc sức khỏe.",
                GiaTien = 150000,
                ThoiGianThucHien = 30,
                LoaiThuCung = "Chó, mèo",
                TrangThaiHoatDong = true
            },
            new DichVu
            {
                TenDichVu = "Spa Tắm & Vệ sinh",
                MoTa = "Tắm sấy, vệ sinh tai, cắt móng và chăm sóc lông cơ bản.",
                GiaTien = 250000,
                ThoiGianThucHien = 60,
                LoaiThuCung = "Chó, mèo",
                TrangThaiHoatDong = true
            },
            new DichVu
            {
                TenDichVu = "Cắt tỉa lông nghệ thuật (Grooming)",
                MoTa = "Tạo kiểu lông theo yêu cầu, phù hợp từng giống thú cưng.",
                GiaTien = 350000,
                ThoiGianThucHien = 120,
                LoaiThuCung = "Chó",
                TrangThaiHoatDong = true
            },
            new DichVu
            {
                TenDichVu = "Tiêm phòng 7 bệnh",
                MoTa = "Tiêm phòng định kỳ và theo dõi phản ứng sau tiêm.",
                GiaTien = 200000,
                ThoiGianThucHien = 15,
                LoaiThuCung = "Chó",
                TrangThaiHoatDong = true
            }
        };

        foreach (var service in services)
        {
            if (!await dbContext.DichVus.AnyAsync(x => x.TenDichVu == service.TenDichVu))
            {
                dbContext.DichVus.Add(service);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedStaffAsync(AppDbContext dbContext)
    {
        if (!await dbContext.HoSoNhanViens.AnyAsync(x => x.MaNhanVien == "local_staff"))
        {
            dbContext.HoSoNhanViens.Add(new HoSoNhanVien
            {
                MaNhanVien = "local_staff",
                ChuyenMon = "Khám tổng quát, tiêm phòng và chăm sóc sau dịch vụ",
                NamKinhNghiem = 3,
                DiemDanhGia = 4.8m,
                SanSangLamViec = true
            });
        }

        var today = DateTime.Today;
        var shifts = new[]
        {
            today,
            today.AddDays(1),
            today.AddDays(2)
        };

        foreach (var shiftDate in shifts)
        {
            if (!await dbContext.CaLamViecs.AnyAsync(x => x.MaNhanVien == "local_staff" && x.NgayLam == shiftDate))
            {
                dbContext.CaLamViecs.Add(new CaLamViec
                {
                    MaNhanVien = "local_staff",
                    NgayLam = shiftDate,
                    GioBatDau = new TimeOnly(8, 0),
                    GioKetThuc = new TimeOnly(17, 0),
                    TrangThai = "Available",
                    GhiChu = "Ca làm mẫu phục vụ demo."
                });
            }
        }
    }

    private static async Task SeedCustomerJourneyAsync(AppDbContext dbContext)
    {
        var customer = await dbContext.NguoiDungs.FirstAsync(x => x.Email == "customer@pethealth.local");
        customer.SoDienThoai = string.IsNullOrWhiteSpace(customer.SoDienThoai) ? "0909000111" : customer.SoDienThoai;
        customer.DiaChi = string.IsNullOrWhiteSpace(customer.DiaChi) ? "Quận Ninh Kiều, Cần Thơ" : customer.DiaChi;

        var pet = await dbContext.ThuCungs.FirstOrDefaultAsync(x => x.MaNguoiDung == customer.MaNguoiDung && x.TenThuCung == "Bún");
        if (pet is null)
        {
            pet = new ThuCung
            {
                MaNguoiDung = customer.MaNguoiDung,
                TenThuCung = "Bún",
                Giong = "Poodle",
                NgaySinh = new DateTime(2023, 6, 12),
                CanNang = 4.8m,
                GhiChu = "Dễ nhạy cảm với âm thanh lớn.",
                TrangThaiHoatDong = true,
                MaQr = "PET-DEMO-BUN",
                NgayCapQr = DateTime.UtcNow
            };
            dbContext.ThuCungs.Add(pet);
            await dbContext.SaveChangesAsync();
        }

        var cat = await dbContext.ThuCungs.FirstOrDefaultAsync(x => x.MaNguoiDung == customer.MaNguoiDung && x.TenThuCung == "Miu");
        if (cat is null)
        {
            dbContext.ThuCungs.Add(new ThuCung
            {
                MaNguoiDung = customer.MaNguoiDung,
                TenThuCung = "Miu",
                Giong = "Mèo Anh lông ngắn",
                NgaySinh = new DateTime(2024, 2, 20),
                CanNang = 3.2m,
                GhiChu = "Cần chải lông định kỳ.",
                TrangThaiHoatDong = true,
                MaQr = "PET-DEMO-MIU",
                NgayCapQr = DateTime.UtcNow
            });
            await dbContext.SaveChangesAsync();
        }

        var generalExam = await dbContext.DichVus.FirstAsync(x => x.TenDichVu == "Khám tổng quát");
        var spa = await dbContext.DichVus.FirstAsync(x => x.TenDichVu == "Spa Tắm & Vệ sinh");
        var vaccine = await dbContext.DichVus.FirstAsync(x => x.TenDichVu == "Tiêm phòng 7 bệnh");

        var completed = await EnsureBookingAsync(
            dbContext,
            customer.MaNguoiDung,
            pet.MaThuCung,
            generalExam.MaDichVu,
            "local_staff",
            DateTime.Today.AddDays(-7),
            new TimeOnly(9, 0),
            new TimeOnly(9, 30),
            "Completed",
            "Dữ liệu mẫu: lịch đã hoàn thành để demo hồ sơ bệnh án.");

        await EnsureBookingServiceAsync(dbContext, completed.MaLichHen, generalExam.MaDichVu);
        await EnsureBookingServiceAsync(dbContext, completed.MaLichHen, vaccine.MaDichVu);

        var upcoming = await EnsureBookingAsync(
            dbContext,
            customer.MaNguoiDung,
            pet.MaThuCung,
            spa.MaDichVu,
            "local_staff",
            DateTime.Today.AddDays(1),
            new TimeOnly(14, 0),
            new TimeOnly(15, 0),
            "Confirmed",
            "Dữ liệu mẫu: lịch sắp tới để demo nhân viên xem lịch phân công.");

        await EnsureBookingServiceAsync(dbContext, upcoming.MaLichHen, spa.MaDichVu);

        if (!await dbContext.HoSoBenhAns.AnyAsync(x => x.MaLichHen == completed.MaLichHen))
        {
            dbContext.HoSoBenhAns.Add(new HoSoBenhAn
            {
                MaLichHen = completed.MaLichHen,
                MaThuCung = pet.MaThuCung,
                MaNhanVien = "local_staff",
                ChanDoan = "Sức khỏe ổn định, cần theo dõi răng miệng và da lông.",
                DieuTri = "Vệ sinh tai, tư vấn khẩu phần ăn và lịch vận động.",
                Thuoc = "Bổ sung vitamin tổng hợp trong 7 ngày.",
                TiemChung = "Đã tiêm phòng nhắc lại theo lịch.",
                GhiChu = "Hồ sơ bệnh án mẫu phục vụ demo.",
                NgayCapNhat = DateTime.UtcNow
            });
        }

        if (!await dbContext.NhacLichTaiKhams.AnyAsync(x => x.MaLichHen == completed.MaLichHen))
        {
            dbContext.NhacLichTaiKhams.Add(new NhacLichTaiKham
            {
                MaLichHen = completed.MaLichHen,
                MaKhachHang = customer.MaNguoiDung,
                Email = customer.Email,
                NgayTaiKham = DateTime.Today.AddMonths(6),
                NoiDung = "Nhắc lịch tái khám sức khỏe định kỳ cho thú cưng.",
                TrangThai = "Pending",
                NgayTao = DateTime.UtcNow
            });
        }
    }

    private static async Task<LichHen> EnsureBookingAsync(
        AppDbContext dbContext,
        string customerId,
        int petId,
        int serviceId,
        string staffId,
        DateTime date,
        TimeOnly start,
        TimeOnly end,
        string status,
        string note)
    {
        var booking = await dbContext.LichHens.FirstOrDefaultAsync(x => x.GhiChu == note);
        if (booking is not null)
        {
            return booking;
        }

        booking = new LichHen
        {
            MaNguoiDung = customerId,
            MaThuCung = petId,
            MaDichVu = serviceId,
            MaNhanVien = staffId,
            NgayHen = date,
            GioHen = start,
            GioKetThuc = end,
            TrangThai = status,
            GhiChu = note,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.LichHens.Add(booking);
        await dbContext.SaveChangesAsync();
        return booking;
    }

    private static async Task EnsureBookingServiceAsync(AppDbContext dbContext, int bookingId, int serviceId)
    {
        if (!await dbContext.LichHenDichVus.AnyAsync(x => x.MaLichHen == bookingId && x.MaDichVu == serviceId))
        {
            dbContext.LichHenDichVus.Add(new LichHenDichVu
            {
                MaLichHen = bookingId,
                MaDichVu = serviceId
            });
        }
    }

    private static async Task SeedNotificationsAsync(AppDbContext dbContext)
    {
        await EnsureNotificationAsync(
            dbContext,
            "local_admin",
            "Có lịch hẹn mới cần theo dõi",
            "Khách hàng mẫu đã có lịch hẹn trong hệ thống để demo màn quản trị.",
            "/admin/operations");

        await EnsureNotificationAsync(
            dbContext,
            "local_staff",
            "Bạn có lịch được phân công",
            "Lịch spa mẫu đã được phân công cho nhân viên PetHealth.",
            "/staff/schedule");

        await EnsureNotificationAsync(
            dbContext,
            "local_customer",
            "Lịch hẹn đã được xác nhận",
            "Lịch chăm sóc thú cưng mẫu đã sẵn sàng để khách hàng theo dõi.",
            "/customer/appointments");
    }

    private static async Task EnsureNotificationAsync(
        AppDbContext dbContext,
        string userId,
        string title,
        string content,
        string url)
    {
        if (!await dbContext.ThongBaoNguoiDungs.AnyAsync(x => x.MaNguoiDung == userId && x.TieuDe == title))
        {
            dbContext.ThongBaoNguoiDungs.Add(new ThongBaoNguoiDung
            {
                MaNguoiDung = userId,
                TieuDe = title,
                NoiDung = content,
                DuongDan = url,
                DaDoc = false,
                NgayTao = DateTime.UtcNow
            });
        }
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
            ("HoaDon", $"MaKhachHang{suffix}", "MaKhachHang"),
            ("CaLamViec", $"MaNhanVien{suffix}", "MaNhanVien"),
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

    private static async Task EnsurePetSoftDeleteColumnAsync(AppDbContext dbContext)
    {
        if (!await dbContext.Database.CanConnectAsync())
        {
            return;
        }

        const string sql = """
            IF OBJECT_ID(N'dbo.ThuCung', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.ThuCung', N'TrangThaiHoatDong') IS NULL
            BEGIN
                ALTER TABLE dbo.ThuCung
                ADD TrangThaiHoatDong bit NOT NULL
                    CONSTRAINT DF_ThuCung_TrangThaiHoatDong DEFAULT (1);
            END;

            IF OBJECT_ID(N'dbo.ThuCung', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.ThuCung', N'GioiTinh') IS NULL
            BEGIN
                ALTER TABLE dbo.ThuCung
                ADD GioiTinh nvarchar(20) NULL;
            END;

            IF OBJECT_ID(N'dbo.ThuCung', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.ThuCung', N'QrCodeUrl') IS NULL
            BEGIN
                ALTER TABLE dbo.ThuCung
                ADD QrCodeUrl nvarchar(1000) NULL;
            END;
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql);
    }
}

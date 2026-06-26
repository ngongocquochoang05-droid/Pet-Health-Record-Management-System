using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace PetHealth_BE.src.Data.Migrations;

[Migration("20260626000000_InitialCodeFirst")]
[DbContext(typeof(AppDbContext))]
public partial class InitialCodeFirst : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.NguoiDung', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.NguoiDung
                (
                    MaNguoiDung nvarchar(50) NOT NULL CONSTRAINT PK_NguoiDung PRIMARY KEY,
                    HoVaTen nvarchar(150) NOT NULL,
                    Email nvarchar(150) NOT NULL,
                    SoDienThoai nvarchar(20) NULL,
                    GioiTinh nvarchar(20) NULL,
                    DiaChi nvarchar(255) NULL,
                    VaiTro nvarchar(50) NOT NULL CONSTRAINT DF_NguoiDung_VaiTro DEFAULT N'Customer',
                    TrangThaiHoatDong bit NOT NULL CONSTRAINT DF_NguoiDung_TrangThaiHoatDong DEFAULT 1,
                    NgayTao datetime2 NOT NULL CONSTRAINT DF_NguoiDung_NgayTao DEFAULT SYSUTCDATETIME(),
                    PasswordHash nvarchar(500) NULL,
                    AuthProvider nvarchar(30) NOT NULL CONSTRAINT DF_NguoiDung_AuthProvider DEFAULT N'Local',
                    GoogleSubject nvarchar(150) NULL,
                    LastLoginAt datetime2 NULL,
                    EmailDaXacMinh bit NOT NULL CONSTRAINT DF_NguoiDung_EmailDaXacMinh DEFAULT 0,
                    LoginCount int NOT NULL CONSTRAINT DF_NguoiDung_LoginCount DEFAULT 0
                );
                CREATE UNIQUE INDEX IX_NguoiDung_Email ON dbo.NguoiDung(Email);
            END;

            IF OBJECT_ID(N'dbo.DichVu', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.DichVu
                (
                    MaDichVu int IDENTITY(1,1) NOT NULL CONSTRAINT PK_DichVu PRIMARY KEY,
                    TenDichVu nvarchar(150) NOT NULL,
                    MoTa nvarchar(1000) NOT NULL,
                    GiaTien decimal(18,2) NOT NULL,
                    ThoiGianThucHien int NOT NULL,
                    AnhDichVuUrl nvarchar(500) NULL,
                    LoaiThuCung nvarchar(100) NULL,
                    TrangThaiHoatDong bit NOT NULL CONSTRAINT DF_DichVu_TrangThaiHoatDong DEFAULT 1
                );
            END;

            IF OBJECT_ID(N'dbo.ThuCung', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ThuCung
                (
                    MaThuCung int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ThuCung PRIMARY KEY,
                    MaChuNhan nvarchar(50) NOT NULL,
                    TenThuCung nvarchar(120) NOT NULL,
                    GiongLoai nvarchar(80) NOT NULL,
                    NgaySinh date NULL,
                    CanNang decimal(5,2) NULL,
                    GhiChu nvarchar(500) NULL,
                    TrangThaiHoatDong bit NOT NULL CONSTRAINT DF_ThuCung_TrangThaiHoatDong DEFAULT 1,
                    MaQr nvarchar(100) NULL,
                    QrCodeUrl nvarchar(1000) NULL,
                    NgayCapQr datetime2 NULL,
                    CONSTRAINT FK_ThuCung_NguoiDung FOREIGN KEY (MaChuNhan) REFERENCES dbo.NguoiDung(MaNguoiDung) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX IX_ThuCung_MaQr ON dbo.ThuCung(MaQr) WHERE MaQr IS NOT NULL;
            END;

            IF OBJECT_ID(N'dbo.LichHen', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.LichHen
                (
                    MaLichHen int IDENTITY(1,1) NOT NULL CONSTRAINT PK_LichHen PRIMARY KEY,
                    MaKhachHang nvarchar(50) NOT NULL,
                    MaThuCung int NOT NULL,
                    MaDichVu int NOT NULL,
                    MaNhanVien nvarchar(50) NULL,
                    NgayHen date NOT NULL,
                    GioBatDau time NOT NULL,
                    GioKetThuc time NULL,
                    TrangThai nvarchar(40) NOT NULL CONSTRAINT DF_LichHen_TrangThai DEFAULT N'Pending',
                    GhiChu nvarchar(500) NULL,
                    NgayTao datetime2 NOT NULL CONSTRAINT DF_LichHen_NgayTao DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT FK_LichHen_NguoiDung FOREIGN KEY (MaKhachHang) REFERENCES dbo.NguoiDung(MaNguoiDung),
                    CONSTRAINT FK_LichHen_ThuCung FOREIGN KEY (MaThuCung) REFERENCES dbo.ThuCung(MaThuCung),
                    CONSTRAINT FK_LichHen_DichVu FOREIGN KEY (MaDichVu) REFERENCES dbo.DichVu(MaDichVu)
                );
            END;

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

            IF OBJECT_ID(N'dbo.HoSoNhanVien', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.HoSoNhanVien
                (
                    MaNhanVien nvarchar(50) NOT NULL CONSTRAINT PK_HoSoNhanVien PRIMARY KEY,
                    ChuyenMon nvarchar(200) NULL,
                    NamKinhNghiem int NOT NULL CONSTRAINT DF_HoSoNhanVien_NamKinhNghiem DEFAULT 0,
                    DiemDanhGia decimal(3,2) NOT NULL CONSTRAINT DF_HoSoNhanVien_DiemDanhGia DEFAULT 0,
                    SanSangLamViec bit NOT NULL CONSTRAINT DF_HoSoNhanVien_SanSangLamViec DEFAULT 1,
                    CONSTRAINT FK_HoSoNhanVien_NguoiDung FOREIGN KEY (MaNhanVien) REFERENCES dbo.NguoiDung(MaNguoiDung) ON DELETE CASCADE
                );
            END;

            IF OBJECT_ID(N'dbo.CaLamViec', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.CaLamViec
                (
                    MaCaLam int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CaLamViec PRIMARY KEY,
                    MaNhanVien nvarchar(50) NOT NULL,
                    NgayLam date NOT NULL,
                    GioBatDau time NOT NULL,
                    GioKetThuc time NOT NULL,
                    TrangThai nvarchar(40) NOT NULL CONSTRAINT DF_CaLamViec_TrangThai DEFAULT N'Available',
                    GhiChu nvarchar(500) NULL,
                    CONSTRAINT FK_CaLamViec_NguoiDung FOREIGN KEY (MaNhanVien) REFERENCES dbo.NguoiDung(MaNguoiDung) ON DELETE CASCADE
                );
                CREATE INDEX IX_CaLamViec_MaNhanVien_NgayLam ON dbo.CaLamViec(MaNhanVien, NgayLam);
            END;

            IF OBJECT_ID(N'dbo.TaiKhoanToken', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.TaiKhoanToken
                (
                    MaToken int IDENTITY(1,1) NOT NULL CONSTRAINT PK_TaiKhoanToken PRIMARY KEY,
                    MaNguoiDung nvarchar(50) NOT NULL,
                    LoaiToken nvarchar(30) NOT NULL,
                    TokenHash nvarchar(128) NOT NULL,
                    HanSuDung datetime2 NOT NULL,
                    DaSuDung bit NOT NULL CONSTRAINT DF_TaiKhoanToken_DaSuDung DEFAULT 0,
                    NgayTao datetime2 NOT NULL CONSTRAINT DF_TaiKhoanToken_NgayTao DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT FK_TaiKhoanToken_NguoiDung FOREIGN KEY (MaNguoiDung) REFERENCES dbo.NguoiDung(MaNguoiDung) ON DELETE CASCADE
                );
                CREATE INDEX IX_TaiKhoanToken_Lookup ON dbo.TaiKhoanToken(LoaiToken, TokenHash, DaSuDung, HanSuDung);
            END;

            IF OBJECT_ID(N'dbo.HoSoBenhAn', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.HoSoBenhAn
                (
                    MaHoSo int IDENTITY(1,1) NOT NULL CONSTRAINT PK_HoSoBenhAn PRIMARY KEY,
                    MaLichHen int NOT NULL,
                    MaThuCung int NOT NULL,
                    MaNhanVien nvarchar(50) NULL,
                    ChanDoan nvarchar(1000) NOT NULL,
                    DieuTri nvarchar(2000) NULL,
                    Thuoc nvarchar(2000) NULL,
                    TiemChung nvarchar(1000) NULL,
                    GhiChu nvarchar(2000) NULL,
                    NgayCapNhat datetime2 NOT NULL CONSTRAINT DF_HoSoBenhAn_NgayCapNhat DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT FK_HoSoBenhAn_LichHen FOREIGN KEY (MaLichHen) REFERENCES dbo.LichHen(MaLichHen) ON DELETE CASCADE,
                    CONSTRAINT FK_HoSoBenhAn_ThuCung FOREIGN KEY (MaThuCung) REFERENCES dbo.ThuCung(MaThuCung),
                    CONSTRAINT FK_HoSoBenhAn_NguoiDung FOREIGN KEY (MaNhanVien) REFERENCES dbo.NguoiDung(MaNguoiDung)
                );
                CREATE UNIQUE INDEX IX_HoSoBenhAn_MaLichHen ON dbo.HoSoBenhAn(MaLichHen);
            END;

            IF OBJECT_ID(N'dbo.HoaDon', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.HoaDon
                (
                    MaHoaDon int IDENTITY(1,1) NOT NULL CONSTRAINT PK_HoaDon PRIMARY KEY,
                    MaLichHen int NOT NULL,
                    MaKhachHang nvarchar(50) NULL,
                    TongTien decimal(18,2) NOT NULL CONSTRAINT DF_HoaDon_TongTien DEFAULT 0,
                    PhuongThucThanhToan nvarchar(50) NULL,
                    TrangThaiThanhToan nvarchar(50) NULL,
                    MaNhanVienXacNhan nvarchar(50) NULL,
                    NgayThanhToan datetime2 NULL
                );
                CREATE UNIQUE INDEX IX_HoaDon_MaLichHen ON dbo.HoaDon(MaLichHen);
            END;

            IF OBJECT_ID(N'dbo.NhacLichTaiKham', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.NhacLichTaiKham
                (
                    MaNhacLich int IDENTITY(1,1) NOT NULL CONSTRAINT PK_NhacLichTaiKham PRIMARY KEY,
                    MaLichHen int NOT NULL,
                    MaKhachHang nvarchar(50) NOT NULL,
                    Email nvarchar(150) NOT NULL,
                    NgayTaiKham date NOT NULL,
                    NoiDung nvarchar(1000) NULL,
                    TrangThai nvarchar(40) NOT NULL CONSTRAINT DF_NhacLichTaiKham_TrangThai DEFAULT N'Pending',
                    NgayTao datetime2 NOT NULL CONSTRAINT DF_NhacLichTaiKham_NgayTao DEFAULT SYSUTCDATETIME(),
                    NgayGui datetime2 NULL
                );
                CREATE INDEX IX_NhacLichTaiKham_TrangThai_NgayTaiKham ON dbo.NhacLichTaiKham(TrangThai, NgayTaiKham);
            END;

            IF OBJECT_ID(N'dbo.ThongBaoNguoiDung', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ThongBaoNguoiDung
                (
                    MaThongBao int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ThongBaoNguoiDung PRIMARY KEY,
                    MaNguoiDung nvarchar(50) NOT NULL,
                    TieuDe nvarchar(300) NOT NULL,
                    NoiDung nvarchar(1000) NOT NULL,
                    DuongDan nvarchar(500) NULL,
                    DaDoc bit NOT NULL CONSTRAINT DF_ThongBaoNguoiDung_DaDoc DEFAULT 0,
                    NgayTao datetime2 NOT NULL CONSTRAINT DF_ThongBaoNguoiDung_NgayTao DEFAULT SYSUTCDATETIME()
                );
                CREATE INDEX IX_ThongBaoNguoiDung_User ON dbo.ThongBaoNguoiDung(MaNguoiDung, DaDoc, NgayTao);
            END;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS dbo.ThongBaoNguoiDung;
            DROP TABLE IF EXISTS dbo.NhacLichTaiKham;
            DROP TABLE IF EXISTS dbo.HoaDon;
            DROP TABLE IF EXISTS dbo.HoSoBenhAn;
            DROP TABLE IF EXISTS dbo.TaiKhoanToken;
            DROP TABLE IF EXISTS dbo.CaLamViec;
            DROP TABLE IF EXISTS dbo.HoSoNhanVien;
            DROP TABLE IF EXISTS dbo.LichHenDichVu;
            DROP TABLE IF EXISTS dbo.LichHen;
            DROP TABLE IF EXISTS dbo.ThuCung;
            DROP TABLE IF EXISTS dbo.DichVu;
            DROP TABLE IF EXISTS dbo.NguoiDung;
            """);
    }
}

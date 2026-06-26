namespace PetHealth_BE.src.DTOs;

public class HoaDonDto
{
    public int MaHoaDon { get; set; }
    public int? MaLichHen { get; set; }
    public string? MaKhachHang { get; set; }
    public string? TenKhachHang { get; set; }
    public decimal TongTien { get; set; }
    public string? PhuongThucThanhToan { get; set; }
    public string? TrangThaiThanhToan { get; set; }
    public string? MaNhanVienXacNhan { get; set; }
    public string? NgayThanhToan { get; set; }
}

public class UpsertHoaDonDto
{
    public int MaLichHen { get; set; }
    public decimal TongTien { get; set; }
    public string PhuongThucThanhToan { get; set; } = "Cash";
    public string TrangThaiThanhToan { get; set; } = "Unpaid";
}

public class CaLamViecDto
{
    public int MaCaLam { get; set; }
    public string MaNhanVien { get; set; } = string.Empty;
    public string? TenNhanVien { get; set; }
    public string NgayLam { get; set; } = string.Empty;
    public string GioBatDau { get; set; } = string.Empty;
    public string GioKetThuc { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
}

public class UpsertCaLamViecDto
{
    public string MaNhanVien { get; set; } = string.Empty;
    public string NgayLam { get; set; } = string.Empty;
    public string GioBatDau { get; set; } = string.Empty;
    public string GioKetThuc { get; set; } = string.Empty;
    public string TrangThai { get; set; } = "Available";
    public string? GhiChu { get; set; }
}

public class CustomerUsageDto
{
    public string MaKhachHang { get; set; } = string.Empty;
    public string HoVaTen { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int LoginCount { get; set; }
    public string? LastLoginAt { get; set; }
    public int SoLanDat { get; set; }
    public int SoLanHoanThanh { get; set; }
    public string? DichVuDaDung { get; set; }
}

public class PetQrDto
{
    public int MaThuCung { get; set; }
    public string TenThuCung { get; set; } = string.Empty;
    public string TenChuNuoi { get; set; } = string.Empty;
    public string EmailChuNuoi { get; set; } = string.Empty;
    public string? MaQr { get; set; }
    public string? QrCodeUrl { get; set; }
    public string? NgayCapQr { get; set; }
}

public class PetHistoryDto
{
    public int MaLichHen { get; set; }
    public int MaThuCung { get; set; }
    public string TenThuCung { get; set; } = string.Empty;
    public string TenDichVu { get; set; } = string.Empty;
    public string NgayHen { get; set; } = string.Empty;
    public string GioHen { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public int? MaHoSo { get; set; }
    public string? ChanDoan { get; set; }
    public string? DieuTri { get; set; }
    public string? Thuoc { get; set; }
    public string? TiemChung { get; set; }
    public string? GhiChuBenhAn { get; set; }
    public string? NgayCapNhatBenhAn { get; set; }
    public string? TenNhanVienCapNhat { get; set; }
}

public class ReminderDto
{
    public int MaNhacLich { get; set; }
    public int MaLichHen { get; set; }
    public string MaKhachHang { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NgayTaiKham { get; set; } = string.Empty;
    public string? NoiDung { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public string NgayTao { get; set; } = string.Empty;
    public string? NgayGui { get; set; }
}

public class CreateReminderDto
{
    public int MaLichHen { get; set; }
    public string NgayTaiKham { get; set; } = string.Empty;
    public string? NoiDung { get; set; }
}

public class StaffUpsertDto
{
    public string MaNhanVien { get; set; } = string.Empty;
    public string HoVaTen { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? SoDienThoai { get; set; }
    public string ChuyenMon { get; set; } = string.Empty;
    public int NamKinhNghiem { get; set; }
    public decimal DiemDanhGia { get; set; }
    public bool SanSangLamViec { get; set; } = true;
}

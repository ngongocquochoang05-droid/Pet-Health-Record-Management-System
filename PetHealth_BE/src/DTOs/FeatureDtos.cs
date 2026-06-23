namespace PetHealth_BE.src.DTOs;

public class DanhGiaDto
{
    public int MaDanhGia { get; set; }
    public int MaLichHen { get; set; }
    public string MaKhachHang { get; set; } = string.Empty;
    public string TenKhachHang { get; set; } = string.Empty;
    public int? MaDichVu { get; set; }
    public string? TenDichVu { get; set; }
    public int SoSao { get; set; }
    public string? NhanXet { get; set; }
    public string NgayTao { get; set; } = string.Empty;
}

public class CreateDanhGiaDto
{
    public int MaLichHen { get; set; }
    public int SoSao { get; set; }
    public string? NhanXet { get; set; }
}

public class HoaDonDto
{
    public int MaHoaDon { get; set; }
    public int? MaLichHen { get; set; }
    public string? MaKhachHang { get; set; }
    public string? TenKhachHang { get; set; }
    public decimal TongTien { get; set; }
    public decimal TongTienTruocUuDai { get; set; }
    public int? MaPhieu { get; set; }
    public string? TenUuDai { get; set; }
    public string? LoaiGiamGia { get; set; }
    public decimal GiaTriGiam { get; set; }
    public string? PhuongThucThanhToan { get; set; }
    public string? TrangThaiThanhToan { get; set; }
    public string? MaNhanVienXacNhan { get; set; }
    public string? NgayThanhToan { get; set; }
}

public class UpsertHoaDonDto
{
    public int MaLichHen { get; set; }
    public decimal TongTien { get; set; }
    public int? MaPhieu { get; set; }
    public string PhuongThucThanhToan { get; set; } = "Cash";
    public string TrangThaiThanhToan { get; set; } = "Unpaid";
}

public class ChuongTrinhUuDaiDto
{
    public int MaUuDai { get; set; }
    public string? TenUuDai { get; set; }
    public int SoLuotYeuCau { get; set; }
    public int ThoiHanThang { get; set; }
    public string LoaiGiamGia { get; set; } = "Full";
    public decimal GiaTriGiam { get; set; }
    public bool TrangThai { get; set; }
}

public class UpsertUuDaiDto
{
    public string TenUuDai { get; set; } = string.Empty;
    public int SoLuotYeuCau { get; set; }
    public int ThoiHanThang { get; set; }
    public string LoaiGiamGia { get; set; } = "Full";
    public decimal GiaTriGiam { get; set; }
    public bool TrangThai { get; set; } = true;
}

public class PhieuUuDaiDto
{
    public int MaPhieu { get; set; }
    public string? MaKhachHang { get; set; }
    public int? MaUuDai { get; set; }
    public string? TenUuDai { get; set; }
    public string? LoaiGiamGia { get; set; }
    public decimal GiaTriGiam { get; set; }
    public string? NgayCap { get; set; }
    public string? HanSuDung { get; set; }
    public bool DaSuDung { get; set; }
    public int? MaLichHenSuDung { get; set; }
}

public class IssueUuDaiDto
{
    public string MaKhachHang { get; set; } = string.Empty;
    public int MaUuDai { get; set; }
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

public class PetVisitImageDto
{
    public int MaAnh { get; set; }
    public int MaLichHen { get; set; }
    public int MaThuCung { get; set; }
    public string TenThuCung { get; set; } = string.Empty;
    public string? TenDichVu { get; set; }
    public string? NgayHen { get; set; }
    public string? GioHen { get; set; }
    public string LoaiAnh { get; set; } = string.Empty;
    public string AnhUrl { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public string NgayTaiLen { get; set; } = string.Empty;
}

public class CreatePetVisitImageDto
{
    public int MaLichHen { get; set; }
    public int MaThuCung { get; set; }
    public string LoaiAnh { get; set; } = "Before";
    public string AnhUrl { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
}

public class UploadPetVisitImageDto
{
    public int MaLichHen { get; set; }
    public int MaThuCung { get; set; }
    public string LoaiAnh { get; set; } = "Before";
    public string? GhiChu { get; set; }
    public IFormFile File { get; set; } = null!;
}

public class DepositDto
{
    public int MaDatCoc { get; set; }
    public int MaLichHen { get; set; }
    public string MaKhachHang { get; set; } = string.Empty;
    public string? TenKhachHang { get; set; }
    public decimal SoTien { get; set; }
    public string PhuongThuc { get; set; } = "BANK_TRANSFER";
    public string MaGiaoDich { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string NgayTao { get; set; } = string.Empty;
    public string? NgayThanhToan { get; set; }
    public string? BienLaiUrl { get; set; }
    public string? GhiChuKhachHang { get; set; }
    public string? MaNguoiDuyet { get; set; }
    public string? NgayDuyet { get; set; }
    public string? LyDoTuChoi { get; set; }
}

public class CreateDepositDto
{
    public int MaLichHen { get; set; }
    public decimal SoTien { get; set; }
}

public class ReviewDepositDto
{
    public bool ChapNhan { get; set; }
    public string? LyDoTuChoi { get; set; }
}

public class UploadDepositReceiptDto
{
    public string? GhiChu { get; set; }
    public IFormFile File { get; set; } = null!;
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

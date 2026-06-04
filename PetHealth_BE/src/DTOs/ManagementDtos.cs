namespace PetHealth_BE.src.DTOs;

public class StaffDto
{
    public string MaNhanVien { get; set; } = string.Empty;

    public string HoVaTen { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? SoDienThoai { get; set; }

    public string? ChuyenMon { get; set; }

    public int? NamKinhNghiem { get; set; }

    public decimal? DiemDanhGia { get; set; }

    public bool SanSangLamViec { get; set; }
}

public class ServiceUpsertDto
{
    public string TenDichVu { get; set; } = string.Empty;

    public string? MoTa { get; set; }

    public decimal GiaTien { get; set; }

    public int ThoiGianThucHien { get; set; }

    public string? AnhDichVuUrl { get; set; }

    public string? LoaiThuCung { get; set; }

    public bool TrangThaiHoatDong { get; set; } = true;
}

public class ReportSummaryDto
{
    public IEnumerable<DailyBookingReportDto> LichTheoNgay { get; set; } = [];

    public IEnumerable<MonthlyBookingReportDto> LichTheoThang { get; set; } = [];

    public IEnumerable<TopServiceReportDto> TopDichVu { get; set; } = [];
    public decimal TongDoanhThu { get; set; }
    public int TongKhachHang { get; set; }
    public int KhachHangMoiThangNay { get; set; }
    public IEnumerable<StaffPerformanceDto> HieuSuatNhanVien { get; set; } = [];
}

public class StaffPerformanceDto
{
    public string MaNhanVien { get; set; } = string.Empty;
    public string HoVaTen { get; set; } = string.Empty;
    public int SoLichDuocGiao { get; set; }
    public int SoLichHoanThanh { get; set; }
    public decimal DoanhThu { get; set; }
}

public class DailyBookingReportDto
{
    public string NgayHen { get; set; } = string.Empty;

    public int SoLich { get; set; }
}

public class MonthlyBookingReportDto
{
    public int Nam { get; set; }

    public int Thang { get; set; }

    public int SoLich { get; set; }
}

public class TopServiceReportDto
{
    public int MaDichVu { get; set; }

    public string TenDichVu { get; set; } = string.Empty;

    public int SoLanDat { get; set; }
}

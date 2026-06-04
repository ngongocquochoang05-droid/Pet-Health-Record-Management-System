namespace PetHealth_BE.src.DTOs;

using System.Text.Json.Serialization;

public class CreateLichHenDto
{
    public string MaNguoiDung { get; set; } = string.Empty;

    public int MaThuCung { get; set; }

    public int MaDichVu { get; set; }

    public List<int> MaDichVus { get; set; } = [];

    public string NgayHen { get; set; } = string.Empty;

    public string GioHen { get; set; } = string.Empty;

    public string? GhiChu { get; set; }
}

public class BookingAvailabilityDto
{
    public string NgayHen { get; set; } = string.Empty;

    public string GioHen { get; set; } = string.Empty;

    public int SoLichTrongNgay { get; set; }

    public int SoLichTrongKhungGio { get; set; }

    public bool NgayDangDong { get; set; }

    public bool KhungGioDangDong { get; set; }

    public string ThongBao { get; set; } = string.Empty;

    public IEnumerable<SuggestedDateDto> NgayGoiY { get; set; } = [];
}

public class SuggestedDateDto
{
    public string NgayHen { get; set; } = string.Empty;

    public int SoLich { get; set; }
}

public class LichHenDto
{
    public int MaLichHen { get; set; }

    public string MaNguoiDung { get; set; } = string.Empty;

    public string TenKhachHang { get; set; } = string.Empty;

    public string EmailKhachHang { get; set; } = string.Empty;

    public int MaThuCung { get; set; }

    public string TenThuCung { get; set; } = string.Empty;

    public int MaDichVu { get; set; }

    [JsonIgnore]
    public string MaDichVuCsv { get; set; } = string.Empty;

    public List<int> MaDichVus =>
        MaDichVuCsv.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(int.Parse)
            .ToList();

    public string TenDichVu { get; set; } = string.Empty;

    public string? MaNhanVien { get; set; }

    public string? TenNhanVien { get; set; }

    public string NgayHen { get; set; } = string.Empty;

    public string GioHen { get; set; } = string.Empty;

    public string TrangThai { get; set; } = string.Empty;

    public decimal TongTien { get; set; }

    public string? GhiChu { get; set; }

    public string CreatedAt { get; set; } = string.Empty;
}

public class UpdateLichHenStatusDto
{
    public string TrangThai { get; set; } = string.Empty;

    public string? GhiChu { get; set; }
}

public class UpdateLichHenDto
{
    public int MaThuCung { get; set; }

    public int MaDichVu { get; set; }

    public List<int> MaDichVus { get; set; } = [];

    public string NgayHen { get; set; } = string.Empty;

    public string GioHen { get; set; } = string.Empty;

    public string? GhiChu { get; set; }
}

public class AssignStaffDto
{
    public string MaNhanVien { get; set; } = string.Empty;
}

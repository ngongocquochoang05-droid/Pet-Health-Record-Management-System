namespace PetHealth_BE.src.DTOs;

public class ThuCungDto
{
    public int MaThuCung { get; set; }

    public string MaNguoiDung { get; set; } = string.Empty;

    public string TenThuCung { get; set; } = string.Empty;

    public string LoaiThuCung { get; set; } = string.Empty;

    public string Giong { get; set; } = string.Empty;

    public string? GioiTinh { get; set; }

    public string? NgaySinh { get; set; }

    public decimal? CanNang { get; set; }

    public string? GhiChu { get; set; }

    public bool TrangThaiHoatDong { get; set; } = true;
}

public class CreateThuCungDto
{
    public string MaNguoiDung { get; set; } = string.Empty;

    public string TenThuCung { get; set; } = string.Empty;

    public string LoaiThuCung { get; set; } = string.Empty;

    public string Giong { get; set; } = string.Empty;

    public string? GioiTinh { get; set; }

    public string? NgaySinh { get; set; }

    public decimal? CanNang { get; set; }

    public string? GhiChu { get; set; }
}

public class UpdateThuCungDto
{
    public string TenThuCung { get; set; } = string.Empty;

    public string LoaiThuCung { get; set; } = string.Empty;

    public string Giong { get; set; } = string.Empty;

    public string? GioiTinh { get; set; }

    public string? NgaySinh { get; set; }

    public decimal? CanNang { get; set; }

    public string? GhiChu { get; set; }
}

namespace PetHealth_BE.src.DTOs;

public class DichVuDto
{
    public int MaDichVu { get; set; }

    public string TenDichVu { get; set; } = string.Empty;

    public string MoTa { get; set; } = string.Empty;

    public decimal GiaTien { get; set; }

    public int ThoiGianThucHien { get; set; }

    public string? AnhDichVuUrl { get; set; }

    public string? LoaiThuCung { get; set; }

    public bool TrangThaiHoatDong { get; set; }

    public int SoLanDat { get; set; }

    public decimal? DiemTrungBinh { get; set; }

    public int SoDanhGia { get; set; }
}

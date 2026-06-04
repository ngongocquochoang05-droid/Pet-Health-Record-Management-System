namespace PetHealth_BE.src.DTOs;

public class MedicalRecordDto
{
    public int MaHoSo { get; set; }
    public int MaLichHen { get; set; }
    public int MaThuCung { get; set; }
    public string TenThuCung { get; set; } = string.Empty;
    public string? MaNhanVien { get; set; }
    public string? TenNhanVien { get; set; }
    public string ChanDoan { get; set; } = string.Empty;
    public string? DieuTri { get; set; }
    public string? Thuoc { get; set; }
    public string? TiemChung { get; set; }
    public string? GhiChu { get; set; }
    public string NgayCapNhat { get; set; } = string.Empty;
}

public class UpsertMedicalRecordDto
{
    public int MaLichHen { get; set; }
    public int MaThuCung { get; set; }
    public string ChanDoan { get; set; } = string.Empty;
    public string? DieuTri { get; set; }
    public string? Thuoc { get; set; }
    public string? TiemChung { get; set; }
    public string? GhiChu { get; set; }
}

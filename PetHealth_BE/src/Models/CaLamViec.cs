using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("CaLamViec")]
public class CaLamViec
{
    [Key]
    public int MaCaLam { get; set; }

    [Required]
    [MaxLength(50)]
    public string MaNhanVien { get; set; } = string.Empty;

    public DateTime NgayLam { get; set; }

    public TimeOnly GioBatDau { get; set; }

    public TimeOnly GioKetThuc { get; set; }

    [Required]
    [MaxLength(40)]
    public string TrangThai { get; set; } = "Available";

    [MaxLength(500)]
    public string? GhiChu { get; set; }

    public NguoiDung? NhanVien { get; set; }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("HoSoNhanVien")]
public class HoSoNhanVien
{
    [Key]
    [MaxLength(50)]
    public string MaNhanVien { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ChuyenMon { get; set; }

    public int NamKinhNghiem { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal DiemDanhGia { get; set; }

    public bool SanSangLamViec { get; set; } = true;

    public NguoiDung? NhanVien { get; set; }
}

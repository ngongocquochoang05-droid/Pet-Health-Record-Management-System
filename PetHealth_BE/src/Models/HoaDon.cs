using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("HoaDon")]
public class HoaDon
{
    [Key]
    public int MaHoaDon { get; set; }

    public int MaLichHen { get; set; }

    [MaxLength(50)]
    public string? MaKhachHang { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TongTien { get; set; }

    [MaxLength(50)]
    public string? PhuongThucThanhToan { get; set; }

    [MaxLength(50)]
    public string? TrangThaiThanhToan { get; set; } = "Unpaid";

    [MaxLength(50)]
    public string? MaNhanVienXacNhan { get; set; }

    public DateTime? NgayThanhToan { get; set; }
}

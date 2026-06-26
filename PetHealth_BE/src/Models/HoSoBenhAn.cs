using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("HoSoBenhAn")]
public class HoSoBenhAn
{
    [Key]
    public int MaHoSo { get; set; }

    public int MaLichHen { get; set; }

    public int MaThuCung { get; set; }

    [MaxLength(50)]
    public string? MaNhanVien { get; set; }

    [Required]
    [MaxLength(1000)]
    public string ChanDoan { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? DieuTri { get; set; }

    [MaxLength(2000)]
    public string? Thuoc { get; set; }

    [MaxLength(1000)]
    public string? TiemChung { get; set; }

    [MaxLength(2000)]
    public string? GhiChu { get; set; }

    public DateTime NgayCapNhat { get; set; } = DateTime.UtcNow;

    public LichHen? LichHen { get; set; }

    public ThuCung? ThuCung { get; set; }

    public NguoiDung? NhanVien { get; set; }
}

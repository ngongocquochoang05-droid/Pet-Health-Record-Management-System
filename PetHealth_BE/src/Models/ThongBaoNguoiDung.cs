using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("ThongBaoNguoiDung")]
public class ThongBaoNguoiDung
{
    [Key]
    public int MaThongBao { get; set; }

    [Required]
    [MaxLength(50)]
    public string MaNguoiDung { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string TieuDe { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string NoiDung { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? DuongDan { get; set; }

    public bool DaDoc { get; set; }

    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
}

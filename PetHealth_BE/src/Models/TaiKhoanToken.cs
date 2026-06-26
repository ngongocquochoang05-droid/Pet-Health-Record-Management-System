using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("TaiKhoanToken")]
public class TaiKhoanToken
{
    [Key]
    public int MaToken { get; set; }

    [Required]
    [MaxLength(50)]
    public string MaNguoiDung { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string LoaiToken { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string TokenHash { get; set; } = string.Empty;

    public DateTime HanSuDung { get; set; }

    public bool DaSuDung { get; set; }

    public DateTime NgayTao { get; set; } = DateTime.UtcNow;

    public NguoiDung? NguoiDung { get; set; }
}

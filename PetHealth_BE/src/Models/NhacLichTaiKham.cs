using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("NhacLichTaiKham")]
public class NhacLichTaiKham
{
    [Key]
    public int MaNhacLich { get; set; }

    public int MaLichHen { get; set; }

    [Required]
    [MaxLength(50)]
    public string MaKhachHang { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    public DateTime NgayTaiKham { get; set; }

    [MaxLength(1000)]
    public string? NoiDung { get; set; }

    [Required]
    [MaxLength(40)]
    public string TrangThai { get; set; } = "Pending";

    public DateTime NgayTao { get; set; } = DateTime.UtcNow;

    public DateTime? NgayGui { get; set; }
}

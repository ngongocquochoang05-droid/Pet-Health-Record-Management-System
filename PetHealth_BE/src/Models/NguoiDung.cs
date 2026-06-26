using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("NguoiDung")]
public class NguoiDung
{
    [Key]
    [Column("MaNguoiDung")]
    [MaxLength(50)]
    public string MaNguoiDung { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string HoVaTen { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? SoDienThoai { get; set; }

    [MaxLength(20)]
    public string? GioiTinh { get; set; }

    [MaxLength(255)]
    public string? DiaChi { get; set; }

    [Required]
    [MaxLength(50)]
    public string VaiTro { get; set; } = "Customer";

    public bool TrangThaiHoatDong { get; set; } = true;

    public DateTime NgayTao { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? PasswordHash { get; set; }

    [Required]
    [MaxLength(30)]
    public string AuthProvider { get; set; } = "Local";

    [MaxLength(150)]
    public string? GoogleSubject { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public bool EmailDaXacMinh { get; set; }

    public int LoginCount { get; set; }

    public ICollection<ThuCung> ThuCungs { get; set; } = new List<ThuCung>();

    public ICollection<LichHen> LichHens { get; set; } = new List<LichHen>();
}


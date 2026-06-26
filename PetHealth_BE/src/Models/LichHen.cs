using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("LichHen")]
public class LichHen
{
    [Key]
    public int MaLichHen { get; set; }

    [Column("MaKhachHang")]
    [MaxLength(50)]
    public string MaNguoiDung { get; set; } = string.Empty;

    public int MaThuCung { get; set; }

    public int MaDichVu { get; set; }

    [MaxLength(50)]
    public string? MaNhanVien { get; set; }

    public DateTime NgayHen { get; set; }

    [Column("GioBatDau")]
    public TimeOnly GioHen { get; set; }

    public TimeOnly? GioKetThuc { get; set; }

    [Required]
    [MaxLength(40)]
    public string TrangThai { get; set; } = "Pending";

    [NotMapped]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TongTien { get; set; }

    [MaxLength(500)]
    public string? GhiChu { get; set; }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public NguoiDung? NguoiDung { get; set; }

    public ThuCung? ThuCung { get; set; }

    public DichVu? DichVu { get; set; }
}


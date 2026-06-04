using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("ThuCung")]
public class ThuCung
{
    [Key]
    public int MaThuCung { get; set; }

    [Column("MaChuNhan")]
    [MaxLength(50)]
    public string MaNguoiDung { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string TenThuCung { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    [Column("GiongLoai")]
    public string Giong { get; set; } = string.Empty;

    [NotMapped]
    public string LoaiThuCung { get; set; } = string.Empty;

    [NotMapped]
    [MaxLength(20)]
    public string? GioiTinh { get; set; }

    public DateTime? NgaySinh { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? CanNang { get; set; }

    [MaxLength(500)]
    public string? GhiChu { get; set; }

    public NguoiDung? NguoiDung { get; set; }

    public ICollection<LichHen> LichHens { get; set; } = new List<LichHen>();
}


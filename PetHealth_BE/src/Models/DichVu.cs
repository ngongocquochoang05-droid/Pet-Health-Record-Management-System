using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("DichVu")]
public class DichVu
{
    [Key]
    public int MaDichVu { get; set; }

    [Required]
    [MaxLength(150)]
    public string TenDichVu { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string MoTa { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal GiaTien { get; set; }

    public int ThoiGianThucHien { get; set; }

    [MaxLength(500)]
    public string? AnhDichVuUrl { get; set; }

    [MaxLength(100)]
    public string? LoaiThuCung { get; set; }

    public bool TrangThaiHoatDong { get; set; } = true;

    public ICollection<LichHen> LichHens { get; set; } = new List<LichHen>();
}

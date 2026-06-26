using System.ComponentModel.DataAnnotations.Schema;

namespace PetHealth_BE.src.Models;

[Table("LichHenDichVu")]
public class LichHenDichVu
{
    public int MaLichHen { get; set; }

    public int MaDichVu { get; set; }

    public LichHen? LichHen { get; set; }

    public DichVu? DichVu { get; set; }
}

namespace PetHealth_BE.src.DTOs;

public class NotificationDto
{
    public int MaThongBao { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string NoiDung { get; set; } = string.Empty;
    public string? DuongDan { get; set; }
    public bool DaDoc { get; set; }
    public string NgayTao { get; set; } = string.Empty;
}

namespace PetHealth_BE.src.DTOs;

public class NguoiDungDto
{
    public string MaNguoiDung { get; set; } = string.Empty;

    public string HoVaTen { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? SoDienThoai { get; set; }

    public string? GioiTinh { get; set; }

    public string? DiaChi { get; set; }

    public string VaiTro { get; set; } = string.Empty;

    public bool TrangThaiHoatDong { get; set; }
}

public class UpdateNguoiDungDto
{
    public string HoVaTen { get; set; } = string.Empty;

    public string? SoDienThoai { get; set; }

    public string? GioiTinh { get; set; }

    public string? DiaChi { get; set; }
}

public class UpdateUserRoleDto
{
    public string VaiTro { get; set; } = string.Empty;

    public bool TrangThaiHoatDong { get; set; } = true;
}

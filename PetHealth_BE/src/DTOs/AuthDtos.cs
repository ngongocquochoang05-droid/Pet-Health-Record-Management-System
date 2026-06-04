namespace PetHealth_BE.src.DTOs;

public class RegisterRequestDto
{
    public string HoVaTen { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string MatKhau { get; set; } = string.Empty;

    public string? SoDienThoai { get; set; }
}

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;

    public string MatKhau { get; set; } = string.Empty;
}

public class EmailRequestDto
{
    public string Email { get; set; } = string.Empty;
}

public class TokenRequestDto
{
    public string Token { get; set; } = string.Empty;
}

public class ResetPasswordRequestDto
{
    public string Token { get; set; } = string.Empty;

    public string MatKhauMoi { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public NguoiDungDto User { get; set; } = new();
}

public class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}

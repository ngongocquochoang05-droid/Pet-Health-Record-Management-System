using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;

namespace PetHealth_BE.src.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public AuthResponseDto Generate(NguoiDung user)
    {
        var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Missing Jwt:Issuer");
        var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Missing Jwt:Audience");
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key");
        var expiresAt = DateTime.UtcNow.AddHours(8);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.MaNguoiDung),
            new(ClaimTypes.Name, user.HoVaTen),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.VaiTro)
        };

        var tokenDescriptor = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256));

        return new AuthResponseDto
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor),
            ExpiresAt = expiresAt,
            User = new NguoiDungDto
            {
                MaNguoiDung = user.MaNguoiDung,
                HoVaTen = user.HoVaTen,
                Email = user.Email,
                SoDienThoai = user.SoDienThoai,
                GioiTinh = user.GioiTinh,
                DiaChi = user.DiaChi,
                VaiTro = user.VaiTro,
                TrangThaiHoatDong = user.TrangThaiHoatDong
            }
        };
    }
}

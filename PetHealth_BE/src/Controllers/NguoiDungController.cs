using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class NguoiDungController : ControllerBase
{
    private readonly NguoiDungRepository _userRepository;

    public NguoiDungController(NguoiDungRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(idValue))
        {
            return Unauthorized(ApiResponseDto<NguoiDungDto>.Fail("Token không hợp lệ."));
        }

        var user = await _userRepository.GetByIdAsync(idValue);
        if (user is null)
        {
            return NotFound(ApiResponseDto<NguoiDungDto>.Fail("Không tìm thấy người dùng."));
        }

        var result = new NguoiDungDto
        {
            MaNguoiDung = user.MaNguoiDung,
            HoVaTen = user.HoVaTen,
            Email = user.Email,
            SoDienThoai = user.SoDienThoai,
            GioiTinh = user.GioiTinh,
            DiaChi = user.DiaChi,
            VaiTro = user.VaiTro,
            TrangThaiHoatDong = user.TrangThaiHoatDong
        };

        return Ok(ApiResponseDto<NguoiDungDto>.Ok(result));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateNguoiDungDto request)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(idValue))
        {
            return Unauthorized(ApiResponseDto<NguoiDungDto>.Fail("Token không hợp lệ."));
        }

        if (string.IsNullOrWhiteSpace(request.HoVaTen))
        {
            return BadRequest(ApiResponseDto<NguoiDungDto>.Fail("Họ và tên là bắt buộc."));
        }

        if (!string.IsNullOrWhiteSpace(request.SoDienThoai)
            && !request.SoDienThoai.All(character => char.IsDigit(character) || character is '+' or '-' or ' '))
        {
            return BadRequest(ApiResponseDto<NguoiDungDto>.Fail("Số điện thoại không hợp lệ."));
        }

        var updated = await _userRepository.UpdateProfileAsync(idValue, request);
        if (!updated)
        {
            return NotFound(ApiResponseDto<NguoiDungDto>.Fail("Không tìm thấy người dùng."));
        }

        var user = await _userRepository.GetByIdAsync(idValue);
        if (user is null)
        {
            return NotFound(ApiResponseDto<NguoiDungDto>.Fail("Không tìm thấy người dùng."));
        }

        var result = new NguoiDungDto
        {
            MaNguoiDung = user.MaNguoiDung,
            HoVaTen = user.HoVaTen,
            Email = user.Email,
            SoDienThoai = user.SoDienThoai,
            GioiTinh = user.GioiTinh,
            DiaChi = user.DiaChi,
            VaiTro = user.VaiTro,
            TrangThaiHoatDong = user.TrangThaiHoatDong
        };

        return Ok(ApiResponseDto<NguoiDungDto>.Ok(result, "Cập nhật hồ sơ thành công."));
    }
}

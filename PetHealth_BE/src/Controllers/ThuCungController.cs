using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ThuCungController : ControllerBase
{
    private readonly ThuCungRepository _petRepository;

    public ThuCungController(ThuCungRepository petRepository)
    {
        _petRepository = petRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetByOwner([FromQuery] string? maNguoiDung)
    {
        var currentUserId = GetCurrentUserId();
        var ownerId = User.IsInRole("Admin") && !string.IsNullOrWhiteSpace(maNguoiDung)
            ? maNguoiDung
            : currentUserId;

        var pets = (await _petRepository.GetByOwnerIdAsync(ownerId))
            .Select(ToDto);

        return Ok(ApiResponseDto<IEnumerable<ThuCungDto>>.Ok(pets));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateThuCungDto request)
    {
        var validationMessage = ValidatePet(request.TenThuCung, request.Giong, request.NgaySinh, request.CanNang);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<ThuCungDto>.Fail(validationMessage));
        }

        var pet = new ThuCung
        {
            MaNguoiDung = User.IsInRole("Admin") && !string.IsNullOrWhiteSpace(request.MaNguoiDung)
                ? request.MaNguoiDung
                : GetCurrentUserId(),
            TenThuCung = request.TenThuCung.Trim(),
            LoaiThuCung = request.LoaiThuCung.Trim(),
            Giong = request.Giong.Trim(),
            GioiTinh = NormalizeGender(request.GioiTinh),
            NgaySinh = DateTime.TryParse(request.NgaySinh, out var ngaySinh) ? ngaySinh : null,
            CanNang = request.CanNang,
            GhiChu = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim()
        };

        var id = await _petRepository.CreateAsync(pet);
        pet.MaThuCung = id;

        return Created($"/api/thucung/{id}", ApiResponseDto<ThuCungDto>.Ok(ToDto(pet), "Thêm thú cưng thành công."));
    }

    [HttpPut("{maThuCung:int}")]
    public async Task<IActionResult> Update(int maThuCung, [FromBody] UpdateThuCungDto request)
    {
        var currentUserId = GetCurrentUserId();
        var existingPet = await _petRepository.GetByIdAsync(maThuCung);
        if (existingPet is null)
        {
            return NotFound(ApiResponseDto<ThuCungDto>.Fail("Không tìm thấy thú cưng."));
        }

        if (!User.IsInRole("Admin") && existingPet.MaNguoiDung != currentUserId)
        {
            return Forbid();
        }

        var validationMessage = ValidatePet(request.TenThuCung, request.Giong, request.NgaySinh, request.CanNang);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<ThuCungDto>.Fail(validationMessage));
        }

        var updatedPet = new ThuCung
        {
            MaThuCung = maThuCung,
            MaNguoiDung = existingPet.MaNguoiDung,
            TenThuCung = request.TenThuCung.Trim(),
            LoaiThuCung = request.LoaiThuCung.Trim(),
            Giong = request.Giong.Trim(),
            GioiTinh = NormalizeGender(request.GioiTinh),
            NgaySinh = DateTime.TryParse(request.NgaySinh, out var ngaySinh) ? ngaySinh : null,
            CanNang = request.CanNang,
            GhiChu = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim(),
            TrangThaiHoatDong = true
        };

        var updated = await _petRepository.UpdateAsync(maThuCung, existingPet.MaNguoiDung, updatedPet);
        if (!updated)
        {
            return NotFound(ApiResponseDto<ThuCungDto>.Fail("Không tìm thấy thú cưng."));
        }

        return Ok(ApiResponseDto<ThuCungDto>.Ok(ToDto(updatedPet), "Cập nhật thú cưng thành công."));
    }

    [HttpDelete("{maThuCung:int}")]
    public async Task<IActionResult> Delete(int maThuCung)
    {
        var currentUserId = GetCurrentUserId();
        var pet = await _petRepository.GetByIdAsync(maThuCung);
        if (pet is null)
        {
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy thú cưng."));
        }

        if (!User.IsInRole("Admin") && pet.MaNguoiDung != currentUserId)
        {
            return Forbid();
        }

        var deleted = await _petRepository.DeleteAsync(maThuCung, pet.MaNguoiDung);
        return deleted
            ? Ok(ApiResponseDto<object>.Ok(null, "Xóa thú cưng thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy thú cưng."));
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }

    private static ThuCungDto ToDto(ThuCung pet)
    {
        return new ThuCungDto
        {
            MaThuCung = pet.MaThuCung,
            MaNguoiDung = pet.MaNguoiDung,
            TenThuCung = pet.TenThuCung,
            LoaiThuCung = pet.LoaiThuCung,
            Giong = pet.Giong,
            GioiTinh = pet.GioiTinh,
            NgaySinh = pet.NgaySinh?.ToString("yyyy-MM-dd"),
            CanNang = pet.CanNang,
            GhiChu = pet.GhiChu,
            TrangThaiHoatDong = pet.TrangThaiHoatDong
        };
    }

    private static string? NormalizeGender(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? ValidatePet(string tenThuCung, string giong, string? ngaySinh, decimal? canNang)
    {
        if (string.IsNullOrWhiteSpace(tenThuCung))
        {
            return "Tên thú cưng là bắt buộc.";
        }

        if (string.IsNullOrWhiteSpace(giong))
        {
            return "Giống/loài thú cưng là bắt buộc.";
        }

        if (!string.IsNullOrWhiteSpace(ngaySinh)
            && (!DateTime.TryParse(ngaySinh, out var birthDate) || birthDate.Date > DateTime.Today))
        {
            return "Ngày sinh thú cưng không hợp lệ.";
        }

        if (canNang is < 0)
        {
            return "Cân nặng không được âm.";
        }

        return null;
    }
}

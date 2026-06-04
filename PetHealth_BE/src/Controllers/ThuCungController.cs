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
            .Select(pet => new ThuCungDto
            {
                MaThuCung = pet.MaThuCung,
                MaNguoiDung = pet.MaNguoiDung,
                TenThuCung = pet.TenThuCung,
                LoaiThuCung = pet.LoaiThuCung,
                Giong = pet.Giong,
                GioiTinh = pet.GioiTinh,
                NgaySinh = pet.NgaySinh?.ToString("yyyy-MM-dd"),
                CanNang = pet.CanNang,
                GhiChu = pet.GhiChu
            });

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
            GioiTinh = string.IsNullOrWhiteSpace(request.GioiTinh) ? null : request.GioiTinh.Trim(),
            NgaySinh = DateTime.TryParse(request.NgaySinh, out var ngaySinh) ? ngaySinh : null,
            CanNang = request.CanNang,
            GhiChu = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim()
        };

        var id = await _petRepository.CreateAsync(pet);
        var result = new ThuCungDto
        {
            MaThuCung = id,
            MaNguoiDung = pet.MaNguoiDung,
            TenThuCung = pet.TenThuCung,
            LoaiThuCung = pet.LoaiThuCung,
            Giong = pet.Giong,
            GioiTinh = pet.GioiTinh,
            NgaySinh = pet.NgaySinh?.ToString("yyyy-MM-dd"),
            CanNang = pet.CanNang,
            GhiChu = pet.GhiChu
        };

        return Created($"/api/thucung/{id}", ApiResponseDto<ThuCungDto>.Ok(result, "Thêm thú cưng thành công."));
    }

    [HttpPut("{maThuCung:int}")]
    public async Task<IActionResult> Update(int maThuCung, [FromBody] UpdateThuCungDto request)
    {
        var currentUserId = GetCurrentUserId();
        var pet = await _petRepository.GetByIdAsync(maThuCung);
        if (pet is null)
        {
            return NotFound(ApiResponseDto<ThuCungDto>.Fail("Không tìm thấy thú cưng."));
        }

        if (!User.IsInRole("Admin") && pet.MaNguoiDung != currentUserId)
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
            MaNguoiDung = pet.MaNguoiDung,
            TenThuCung = request.TenThuCung.Trim(),
            LoaiThuCung = request.LoaiThuCung.Trim(),
            Giong = request.Giong.Trim(),
            GioiTinh = string.IsNullOrWhiteSpace(request.GioiTinh) ? null : request.GioiTinh.Trim(),
            NgaySinh = DateTime.TryParse(request.NgaySinh, out var ngaySinh) ? ngaySinh : null,
            CanNang = request.CanNang,
            GhiChu = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim()
        };

        var updated = await _petRepository.UpdateAsync(maThuCung, pet.MaNguoiDung, updatedPet);
        if (!updated)
        {
            return NotFound(ApiResponseDto<ThuCungDto>.Fail("Không tìm thấy thú cưng."));
        }

        var result = new ThuCungDto
        {
            MaThuCung = maThuCung,
            MaNguoiDung = updatedPet.MaNguoiDung,
            TenThuCung = updatedPet.TenThuCung,
            LoaiThuCung = updatedPet.LoaiThuCung,
            Giong = updatedPet.Giong,
            GioiTinh = updatedPet.GioiTinh,
            NgaySinh = updatedPet.NgaySinh?.ToString("yyyy-MM-dd"),
            CanNang = updatedPet.CanNang,
            GhiChu = updatedPet.GhiChu
        };

        return Ok(ApiResponseDto<ThuCungDto>.Ok(result, "Cập nhật thú cưng thành công."));
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

        if (await _petRepository.HasAppointmentsAsync(maThuCung))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Thú cưng đã có lịch hẹn, không nên xóa trực tiếp."));
        }

        var deleted = await _petRepository.DeleteAsync(maThuCung, pet.MaNguoiDung);
        return deleted
            ? Ok(ApiResponseDto<object>.Ok(null, "Xóa thú cưng thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy thú cưng."));
    }

    private string GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return value ?? string.Empty;
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

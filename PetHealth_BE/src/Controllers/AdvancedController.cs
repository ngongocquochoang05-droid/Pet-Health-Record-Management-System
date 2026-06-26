using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;
using PetHealth_BE.src.Services;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AdvancedController : ControllerBase
{
    private static readonly HttpClient QrImageClient = new();

    private readonly FeatureRepository _featureRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<AdvancedController> _logger;

    public AdvancedController(
        FeatureRepository featureRepository,
        IEmailService emailService,
        ILogger<AdvancedController> logger)
    {
        _featureRepository = featureRepository;
        _emailService = emailService;
        _logger = logger;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("customers/usage")]
    public async Task<IActionResult> GetCustomerUsage()
    {
        var data = await _featureRepository.GetCustomerUsageAsync();
        return Ok(ApiResponseDto<IEnumerable<CustomerUsageDto>>.Ok(data));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("pets/{maThuCung:int}/qr")]
    public async Task<IActionResult> IssuePetQr(int maThuCung)
    {
        var qr = await _featureRepository.IssuePetQrAsync(maThuCung);
        if (qr is null)
        {
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy thú cưng."));
        }

        var emailSent = await SendPetQrEmailAsync(qr);

        return Ok(ApiResponseDto<object>.Ok(new
        {
            qr.MaThuCung,
            qr.TenThuCung,
            qr.TenChuNuoi,
            qr.EmailChuNuoi,
            qr.MaQr,
            qr.QrCodeUrl,
            qr.NgayCapQr,
            emailDaGui = emailSent
        }, emailSent
            ? "Đã cấp mã QR và gửi email cho chủ thú cưng."
            : "Đã cấp mã QR nhưng chưa gửi được email. Hãy kiểm tra email chủ nuôi và cấu hình SMTP."));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("pets/history")]
    public async Task<IActionResult> GetPetHistory([FromQuery] int? maThuCung, [FromQuery] string? maQr)
    {
        if (!maThuCung.HasValue && string.IsNullOrWhiteSpace(maQr))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Cần nhập mã thú cưng hoặc mã QR."));
        }

        var history = await _featureRepository.GetPetHistoryAsync(maThuCung, string.IsNullOrWhiteSpace(maQr) ? null : maQr.Trim());
        return Ok(ApiResponseDto<IEnumerable<PetHistoryDto>>.Ok(history));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("reminders")]
    public async Task<IActionResult> GetReminders()
    {
        var reminders = await _featureRepository.GetRemindersAsync();
        return Ok(ApiResponseDto<IEnumerable<ReminderDto>>.Ok(reminders));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("reminders")]
    public async Task<IActionResult> CreateReminder([FromBody] CreateReminderDto request)
    {
        if (request.MaLichHen <= 0 || !DateTime.TryParse(request.NgayTaiKham, out _))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Thông tin nhắc lịch không hợp lệ."));
        }

        var id = await _featureRepository.CreateReminderAsync(request);
        var reminder = await _featureRepository.GetReminderByIdAsync(id);
        var emailSent = false;
        if (reminder is not null)
        {
            emailSent = await SendReminderEmailAsync(reminder);
            if (emailSent)
            {
                await _featureRepository.MarkReminderSentAsync(id);
            }
        }

        return Ok(ApiResponseDto<object>.Ok(new
        {
            maNhacLich = id,
            emailDaGui = emailSent,
            emailNhan = reminder is null ? null : MaskEmail(reminder.Email)
        }, emailSent ? "Đã tạo nhắc lịch tái khám và gửi email." : "Đã tạo nhắc lịch tái khám nhưng chưa có email hợp lệ để gửi."));
    }

    private async Task<bool> SendPetQrEmailAsync(PetQrDto qr)
    {
        if (string.IsNullOrWhiteSpace(qr.EmailChuNuoi))
        {
            _logger.LogWarning("Không gửi QR thú cưng {MaThuCung} vì chủ nuôi chưa có email.", qr.MaThuCung);
            return false;
        }

        try
        {
            var attachments = new List<InlineEmailImage>();
            var qrImage = string.Empty;

            if (!string.IsNullOrWhiteSpace(qr.QrCodeUrl))
            {
                qrImage = BuildQrImageHtml(qr);
                var imageBytes = await TryDownloadQrImageAsync(qr.QrCodeUrl);
                if (imageBytes is not null)
                {
                    attachments.Add(new InlineEmailImage("pethealth-pet-qr", imageBytes, "image/png"));
                }
            }

            await _emailService.SendAsync(
                qr.EmailChuNuoi,
                "PetHealth - Mã QR thú cưng",
                $"""
                <h2>Mã QR thú cưng</h2>
                <p>Xin chào {qr.TenChuNuoi},</p>
                <p>PetHealth đã cấp mã QR cho thú cưng của bạn.</p>
                <p>Tên thú cưng: <strong>{qr.TenThuCung}</strong></p>
                <p>Mã QR: <strong>{qr.MaQr}</strong></p>
                {qrImage}
                <p>Bạn có thể dùng mã QR này để tra cứu lịch sử chăm sóc tại PetHealth.</p>
                """,
                attachments);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không gửi được email QR cho thú cưng {MaThuCung} đến {Email}.", qr.MaThuCung, qr.EmailChuNuoi);
            return false;
        }
    }

    private static string BuildQrImageHtml(PetQrDto qr)
    {
        if (string.IsNullOrWhiteSpace(qr.QrCodeUrl))
        {
            return string.Empty;
        }

        return $"""
            <p>
              <img src="{qr.QrCodeUrl}" alt="QR thu cung {qr.TenThuCung}" width="220" height="220" style="width:220px;height:220px;border:0;" />
            </p>
            <p>Neu anh QR khong hien thi, vui long mo lien ket QR: <a href="{qr.QrCodeUrl}">{qr.QrCodeUrl}</a></p>
            """;
    }

    private static async Task<byte[]?> TryDownloadQrImageAsync(string qrCodeUrl)
    {
        try
        {
            using var response = await QrImageClient.GetAsync(qrCodeUrl);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadAsByteArrayAsync();
        }
        catch
        {
            return null;
        }
    }

    private async Task<bool> SendReminderEmailAsync(ReminderDto reminder)
    {
        if (string.IsNullOrWhiteSpace(reminder.Email))
        {
            return false;
        }

        var content = string.IsNullOrWhiteSpace(reminder.NoiDung)
            ? "PetHealth xin nhắc bạn về lịch tái khám của thú cưng."
            : reminder.NoiDung;

        await _emailService.SendAsync(
            reminder.Email,
            "PetHealth - Nhắc lịch tái khám",
            $"""
            <h2>Nhắc lịch tái khám</h2>
            <p>PetHealth xin nhắc bạn về lịch tái khám đã được tạo trên hệ thống.</p>
            <p>Ngày tái khám: <strong>{reminder.NgayTaiKham}</strong></p>
            <p>Nội dung: {content}</p>
            <p>Vui lòng đến đúng lịch để thú cưng được chăm sóc tốt nhất.</p>
            """);

        return true;
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return email;
        }

        var parts = email.Split('@', 2);
        var name = parts[0];
        var visibleName = name.Length <= 2 ? name[0] + "***" : name[..2] + "***";
        return $"{visibleName}@{parts[1]}";
    }
}

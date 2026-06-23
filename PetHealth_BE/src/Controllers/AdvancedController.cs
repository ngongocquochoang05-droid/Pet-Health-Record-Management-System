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
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdvancedController> _logger;

    public AdvancedController(
        FeatureRepository featureRepository,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<AdvancedController> logger)
    {
        _featureRepository = featureRepository;
        _emailService = emailService;
        _configuration = configuration;
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

    [HttpGet("visit-images")]
    public async Task<IActionResult> GetVisitImages([FromQuery] int? maLichHen, [FromQuery] int? maThuCung)
    {
        var images = await _featureRepository.GetVisitImagesAsync(
            maLichHen,
            maThuCung,
            GetCurrentUserId(),
            User.IsInRole("Staff"));
        return Ok(ApiResponseDto<IEnumerable<PetVisitImageDto>>.Ok(images));
    }

    [Authorize(Roles = "Staff")]
    [HttpPost("visit-images")]
    public async Task<IActionResult> AddVisitImage([FromBody] CreatePetVisitImageDto request)
    {
        if (request.MaLichHen <= 0 || request.MaThuCung <= 0 || string.IsNullOrWhiteSpace(request.AnhUrl))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Thông tin ảnh trước/sau khi khám không hợp lệ."));
        }

        if (!await _featureRepository.CanManageVisitImageAsync(request.MaLichHen, request.MaThuCung, GetCurrentUserId(), false))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Lịch hẹn và thú cưng không khớp hoặc bạn không được phân công."));
        }

        request.LoaiAnh = request.LoaiAnh.Equals("After", StringComparison.OrdinalIgnoreCase) ? "After" : "Before";
        var id = await _featureRepository.AddVisitImageAsync(request);
        return Created($"/api/advanced/visit-images/{id}", ApiResponseDto<object>.Ok(new { maAnh = id }, "Đã lưu ảnh khám."));
    }

    [Authorize(Roles = "Staff")]
    [HttpPost("visit-images/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadVisitImage([FromForm] UploadPetVisitImageDto request)
    {
        var file = request.File;
        if (request.MaLichHen <= 0 || request.MaThuCung <= 0 || file is null || file.Length <= 0)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Thông tin ảnh trước/sau khi khám không hợp lệ."));
        }

        const long maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Kích thước ảnh không được vượt quá 5 MB."));
        }

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };
        var extension = Path.GetExtension(file.FileName);
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp."));
        }

        var allowedContentTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };
        if (!allowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Định dạng nội dung ảnh không hợp lệ."));
        }

        if (!await _featureRepository.CanManageVisitImageAsync(request.MaLichHen, request.MaThuCung, GetCurrentUserId(), false))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Lịch hẹn và thú cưng không khớp hoặc bạn không được phân công."));
        }

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "src", "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsRoot);
        var safeFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadsRoot, safeFileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/{safeFileName}";
        var imageRequest = new CreatePetVisitImageDto
        {
            MaLichHen = request.MaLichHen,
            MaThuCung = request.MaThuCung,
            LoaiAnh = request.LoaiAnh.Equals("After", StringComparison.OrdinalIgnoreCase) ? "After" : "Before",
            AnhUrl = imageUrl,
            GhiChu = request.GhiChu
        };

        var id = await _featureRepository.AddVisitImageAsync(imageRequest);
        return Created($"/api/advanced/visit-images/{id}", ApiResponseDto<object>.Ok(new
        {
            maAnh = id,
            anhUrl = imageUrl
        }, "Đã upload và lưu ảnh khám."));
    }

    [Authorize(Roles = "Staff")]
    [HttpDelete("visit-images/{maAnh:int}")]
    public async Task<IActionResult> DeleteVisitImage(int maAnh)
    {
        var url = await _featureRepository.DeleteVisitImageAsync(maAnh, GetCurrentUserId(), false);
        if (url is null) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy ảnh hoặc bạn không có quyền xóa."));
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.AbsolutePath.StartsWith("/uploads/", StringComparison.Ordinal))
        {
            var relativePath = uri.AbsolutePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "src", "wwwroot", relativePath);
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
        }
        return Ok(ApiResponseDto<object>.Ok(null, "Đã xóa ảnh hồ sơ."));
    }

    [HttpGet("deposits")]
    public async Task<IActionResult> GetDeposits()
    {
        var userId = User.IsInRole("Admin") ? null : GetCurrentUserId();
        var deposits = await _featureRepository.GetDepositsAsync(userId);
        return Ok(ApiResponseDto<IEnumerable<DepositDto>>.Ok(deposits));
    }

    [HttpPost("deposits/bank-transfer")]
    public async Task<IActionResult> CreateBankTransferDeposit([FromBody] CreateDepositDto request)
    {
        if (request.MaLichHen <= 0 || request.SoTien <= 0)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Thông tin đặt cọc không hợp lệ."));
        }

        var id = await _featureRepository.CreateDepositAsync(request, GetCurrentUserId());
        if (!id.HasValue)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Lịch hẹn không hợp lệ, không thuộc tài khoản hoặc đã có yêu cầu đặt cọc."));
        }

        var deposit = await _featureRepository.GetDepositByIdAsync(id.Value);
        return Ok(ApiResponseDto<object>.Ok(new
        {
            maDatCoc = id.Value,
            deposit,
            bankTransfer = BuildBankTransferInfo(deposit)
        }, "Đã tạo yêu cầu đặt cọc chuyển khoản ngân hàng."));
    }

    [HttpPost("deposits/{maDatCoc:int}/receipt")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDepositReceipt(int maDatCoc, [FromForm] UploadDepositReceiptDto request)
    {
        var file = request.File;
        if (file is null || file.Length <= 0)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Vui lòng chọn ảnh biên lai."));
        }

        const long maxFileSize = 5 * 1024 * 1024;
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".pdf"
        };
        var allowedContentTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "application/pdf"
        };
        var extension = Path.GetExtension(file.FileName);
        if (file.Length > maxFileSize || !allowedExtensions.Contains(extension) || !allowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Biên lai phải là ảnh hoặc PDF và không vượt quá 5 MB."));
        }

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "src", "wwwroot", "uploads", "deposit-receipts");
        Directory.CreateDirectory(uploadsRoot);
        var safeFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadsRoot, safeFileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var receiptUrl = $"{Request.Scheme}://{Request.Host}/uploads/deposit-receipts/{safeFileName}";
        var updated = await _featureRepository.SaveDepositReceiptAsync(maDatCoc, GetCurrentUserId(), receiptUrl, request.GhiChu);
        if (!updated)
        {
            System.IO.File.Delete(filePath);
            return BadRequest(ApiResponseDto<object>.Fail("Không tìm thấy yêu cầu đặt cọc hoặc yêu cầu đã được xác nhận."));
        }

        return Ok(ApiResponseDto<object>.Ok(new { bienLaiUrl = receiptUrl }, "Đã gửi biên lai để Admin kiểm tra."));
    }

    [HttpPost("loyalty/claim")]
    public async Task<IActionResult> ClaimLoyaltyVoucher()
    {
        var id = await _featureRepository.ClaimLoyaltyVoucherAsync(GetCurrentUserId());
        return id > 0
            ? Ok(ApiResponseDto<object>.Ok(new { maPhieu = id }, "Đã cấp ưu đãi miễn phí 1 lần khám."))
            : BadRequest(ApiResponseDto<object>.Fail("Chưa đủ 3 lần khám hoàn thành hoặc đã có phiếu ưu đãi chưa sử dụng."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("deposits/{maDatCoc:int}/review")]
    public async Task<IActionResult> ReviewDeposit(int maDatCoc, [FromBody] ReviewDepositDto request)
    {
        if (!request.ChapNhan && string.IsNullOrWhiteSpace(request.LyDoTuChoi))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Vui lòng nhập lý do từ chối biên lai."));
        }

        var updated = await _featureRepository.ReviewDepositAsync(
            maDatCoc,
            GetCurrentUserId(),
            request.ChapNhan,
            request.LyDoTuChoi);
        return updated
            ? Ok(ApiResponseDto<object>.Ok(null, request.ChapNhan ? "Đã xác nhận đặt cọc." : "Đã từ chối biên lai."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy đặt cọc cần duyệt."));
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

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }

    private object BuildBankTransferInfo(DepositDto? deposit)
    {
        return new
        {
            bankName = GetConfiguredValue("BankTransfer:BankName", "Ten ngan hang"),
            accountNumber = GetConfiguredValue("BankTransfer:AccountNumber", "So tai khoan"),
            accountName = GetConfiguredValue("BankTransfer:AccountName", "PETHEALTH"),
            transferContent = deposit?.MaGiaoDich ?? "PETHEALTH-DAT-COC",
            note = GetConfiguredValue("BankTransfer:Note", "Chuyen khoan dung noi dung de admin doi soat va xac nhan dat coc.")
        };
    }

    private string GetConfiguredValue(string key, string fallback)
    {
        var value = _configuration[key]?.Trim();
        if (string.IsNullOrWhiteSpace(value) || (value.StartsWith("__", StringComparison.Ordinal) && value.EndsWith("__", StringComparison.Ordinal)))
        {
            return fallback;
        }

        return value;
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

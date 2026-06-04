using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Services;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/email")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;

    public EmailController(IEmailService emailService)
    {
        _emailService = emailService;
    }

    [HttpPost("test")]
    public async Task<IActionResult> SendTest([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Vui lòng nhập email nhận."));
        }

        await _emailService.SendAsync(
            email.Trim(),
            "PetHealth - Test email",
            """
            <h2>PetHealth</h2>
            <p>Email SMTP đã được cấu hình thành công.</p>
            """);

        return Ok(ApiResponseDto<object>.Ok(null, "Đã gửi email test."));
    }
}

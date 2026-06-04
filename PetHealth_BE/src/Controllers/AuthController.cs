using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Services;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly IConfiguration _configuration;

    public AuthController(AuthService authService, IConfiguration configuration)
    {
        _authService = authService;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            await _authService.RegisterAsync(request);
            return Ok(ApiResponseDto<object>.Ok(null, "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponseDto<AuthResponseDto>.Fail(ex.Message));
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(ApiResponseDto<AuthResponseDto>.Ok(result, "Đăng nhập thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponseDto<AuthResponseDto>.Fail(ex.Message));
        }
    }

    [HttpGet("google-login")]
    public IActionResult GoogleLogin()
    {
        if (IsGoogleConfigMissing())
        {
            return BadRequest(ApiResponseDto<object>.Fail("Chưa cấu hình Google ClientId/ClientSecret trong user-secrets, biến môi trường hoặc appsettings.Local.json."));
        }

        var redirectUrl = Url.Action(nameof(GoogleCallback), "Auth", null, Request.Scheme)
            ?? "/api/auth/google-callback";
        var properties = new AuthenticationProperties
        {
            RedirectUri = redirectUrl
        };

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] TokenRequestDto request)
    {
        try
        {
            await _authService.VerifyEmailAsync(request.Token);
            return Ok(ApiResponseDto<object>.Ok(null, "Xác minh email thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponseDto<object>.Fail(ex.Message));
        }
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] EmailRequestDto request)
    {
        await _authService.SendVerificationEmailAsync(request.Email);
        return Ok(ApiResponseDto<object>.Ok(null, "Nếu email hợp lệ, hệ thống đã gửi lại đường dẫn xác minh."));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] EmailRequestDto request)
    {
        await _authService.SendPasswordResetEmailAsync(request.Email);
        return Ok(ApiResponseDto<object>.Ok(null, "Nếu email hợp lệ, hệ thống đã gửi hướng dẫn đặt lại mật khẩu."));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.Token, request.MatKhauMoi);
            return Ok(ApiResponseDto<object>.Ok(null, "Đặt lại mật khẩu thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponseDto<object>.Fail(ex.Message));
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request)
    {
        try
        {
            var result = await _authService.RefreshSessionAsync(request.RefreshToken);
            return Ok(ApiResponseDto<AuthResponseDto>.Ok(result, "Đã làm mới phiên đăng nhập."));
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(ApiResponseDto<AuthResponseDto>.Fail(ex.Message));
        }
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        var frontendBaseUrl = (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
        var authResult = await HttpContext.AuthenticateAsync("External");
        if (!authResult.Succeeded || authResult.Principal is null)
        {
            return Redirect($"{frontendBaseUrl}/auth/google-callback?error=google_auth_failed");
        }

        var googleUserId = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var email = authResult.Principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var fullName = authResult.Principal.FindFirstValue(ClaimTypes.Name) ?? email;

        try
        {
            var session = await _authService.LoginWithGoogleAsync(googleUserId, email, fullName);
            await HttpContext.SignOutAsync("External");

            var url = BuildFrontendCallbackUrl(frontendBaseUrl, session);
            return Redirect(url);
        }
        catch (InvalidOperationException ex)
        {
            await HttpContext.SignOutAsync("External");
            return Redirect($"{frontendBaseUrl}/auth/google-callback?error={Uri.EscapeDataString(ex.Message)}");
        }
    }

    private bool IsGoogleConfigMissing()
    {
        var clientId = _configuration["Google:ClientId"]?.Trim();
        var clientSecret = _configuration["Google:ClientSecret"]?.Trim();
        return string.IsNullOrWhiteSpace(clientId)
            || string.IsNullOrWhiteSpace(clientSecret)
            || clientId == "YOUR_GOOGLE_CLIENT_ID"
            || clientSecret == "YOUR_GOOGLE_CLIENT_SECRET"
            || clientId == "__GOOGLE_CLIENT_ID__"
            || clientSecret == "__GOOGLE_CLIENT_SECRET__";
    }

    private static string BuildFrontendCallbackUrl(string frontendBaseUrl, AuthResponseDto session)
    {
        var query = new Dictionary<string, string?>
        {
            ["accessToken"] = session.AccessToken,
            ["refreshToken"] = session.RefreshToken,
            ["expiresAt"] = session.ExpiresAt.ToString("O"),
            ["maNguoiDung"] = session.User.MaNguoiDung,
            ["hoVaTen"] = session.User.HoVaTen,
            ["email"] = session.User.Email,
            ["soDienThoai"] = session.User.SoDienThoai,
            ["gioiTinh"] = session.User.GioiTinh,
            ["diaChi"] = session.User.DiaChi,
            ["vaiTro"] = session.User.VaiTro,
            ["trangThaiHoatDong"] = session.User.TrangThaiHoatDong.ToString()
        };

        var encodedQuery = string.Join("&", query
            .Where(item => item.Value is not null)
            .Select(item => $"{Uri.EscapeDataString(item.Key)}={Uri.EscapeDataString(item.Value ?? string.Empty)}"));

        return $"{frontendBaseUrl}/auth/google-callback?{encodedQuery}";
    }
}

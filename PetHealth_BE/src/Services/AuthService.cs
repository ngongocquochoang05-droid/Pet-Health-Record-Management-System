using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Services;

public class AuthService
{
    private readonly NguoiDungRepository _userRepository;
    private readonly PasswordHasherService _passwordHasher;
    private readonly JwtTokenService _jwtTokenService;
    private readonly TaiKhoanTokenRepository _tokenRepository;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public AuthService(
        NguoiDungRepository userRepository,
        PasswordHasherService passwordHasher,
        JwtTokenService jwtTokenService,
        TaiKhoanTokenRepository tokenRepository,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _tokenRepository = tokenRepository;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task RegisterAsync(RegisterRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.MatKhau) || string.IsNullOrWhiteSpace(request.HoVaTen))
        {
            throw new InvalidOperationException("Họ và tên, email và mật khẩu là bắt buộc.");
        }

        if (!IsValidEmail(request.Email))
        {
            throw new InvalidOperationException("Email không hợp lệ.");
        }

        if (request.MatKhau.Length < 6)
        {
            throw new InvalidOperationException("Mật khẩu phải có tối thiểu 6 ký tự.");
        }

        if (!string.IsNullOrWhiteSpace(request.SoDienThoai)
            && !request.SoDienThoai.All(character => char.IsDigit(character) || character is '+' or '-' or ' '))
        {
            throw new InvalidOperationException("Số điện thoại không hợp lệ.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _userRepository.GetByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("Email đã tồn tại trong hệ thống.");
        }

        var user = new NguoiDung
        {
            MaNguoiDung = $"local_{Guid.NewGuid():N}",
            HoVaTen = request.HoVaTen.Trim(),
            Email = normalizedEmail,
            SoDienThoai = string.IsNullOrWhiteSpace(request.SoDienThoai) ? null : request.SoDienThoai.Trim(),
            GioiTinh = string.Empty,
            DiaChi = string.Empty,
            VaiTro = "Customer",
            TrangThaiHoatDong = true,
            NgayTao = DateTime.UtcNow,
            PasswordHash = _passwordHasher.Hash(request.MatKhau),
            AuthProvider = "Local",
            LastLoginAt = DateTime.UtcNow,
            EmailDaXacMinh = false
        };

        user.MaNguoiDung = await _userRepository.CreateAsync(user);
        await SendVerificationEmailAsync(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        if (!IsValidEmail(request.Email) || string.IsNullOrWhiteSpace(request.MatKhau))
        {
            throw new InvalidOperationException("Thông tin đăng nhập không hợp lệ.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail)
            ?? throw new InvalidOperationException("Thông tin đăng nhập không hợp lệ.");

        if (!user.TrangThaiHoatDong)
        {
            throw new InvalidOperationException("Tài khoản đã bị khóa.");
        }

        if (!user.EmailDaXacMinh)
        {
            throw new InvalidOperationException("Tài khoản chưa xác minh email. Vui lòng kiểm tra hộp thư hoặc gửi lại email xác minh.");
        }

        if (!string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            if (!_passwordHasher.Verify(request.MatKhau, user.PasswordHash))
            {
                throw new InvalidOperationException("Thông tin đăng nhập không hợp lệ.");
            }

            await _userRepository.UpdateLastLoginAsync(user.MaNguoiDung);
            return await CreateSessionAsync(user);
        }

        throw new InvalidOperationException("Tài khoản chưa có mật khẩu. Vui lòng dùng chức năng quên mật khẩu để thiết lập mật khẩu mới.");
    }

    public async Task<AuthResponseDto> LoginWithGoogleAsync(string googleUserId, string email, string fullName)
    {
        if (string.IsNullOrWhiteSpace(googleUserId) || string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException("Thông tin Google không hợp lệ.");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var googleSubject = googleUserId.Trim();
        var existingGoogleUser = await _userRepository.GetByGoogleSubjectAsync(googleSubject);
        if (existingGoogleUser is not null)
        {
            if (!existingGoogleUser.TrangThaiHoatDong)
            {
                throw new InvalidOperationException("Tài khoản đã bị khóa.");
            }

            await _userRepository.UpdateLastLoginAsync(existingGoogleUser.MaNguoiDung);
            return await CreateSessionAsync(existingGoogleUser);
        }

        var existingUser = await _userRepository.GetByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            if (!existingUser.TrangThaiHoatDong)
            {
                throw new InvalidOperationException("Tài khoản đã bị khóa.");
            }

            if (string.IsNullOrWhiteSpace(existingUser.GoogleSubject))
            {
                existingUser.GoogleSubject = googleSubject;
                await _userRepository.LinkGoogleAsync(existingUser.MaNguoiDung, googleSubject);
            }

            await _userRepository.UpdateLastLoginAsync(existingUser.MaNguoiDung);
            return await CreateSessionAsync(existingUser);
        }

        var user = new NguoiDung
        {
            MaNguoiDung = $"google_{googleSubject}",
            HoVaTen = string.IsNullOrWhiteSpace(fullName) ? normalizedEmail : fullName.Trim(),
            Email = normalizedEmail,
            SoDienThoai = string.Empty,
            GioiTinh = string.Empty,
            DiaChi = string.Empty,
            VaiTro = "Customer",
            TrangThaiHoatDong = true,
            NgayTao = DateTime.UtcNow,
            AuthProvider = "Google",
            GoogleSubject = googleSubject,
            LastLoginAt = DateTime.UtcNow,
            EmailDaXacMinh = true
        };

        user.MaNguoiDung = await _userRepository.CreateAsync(user);
        return await CreateSessionAsync(user);
    }

    public async Task<AuthResponseDto> RefreshSessionAsync(string refreshToken)
    {
        var userId = await ConsumeTokenAsync("RefreshToken", refreshToken);
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Tài khoản không còn tồn tại.");
        if (!user.TrangThaiHoatDong) throw new InvalidOperationException("Tài khoản đã bị khóa.");
        return await CreateSessionAsync(user);
    }

    private async Task<AuthResponseDto> CreateSessionAsync(NguoiDung user)
    {
        var session = _jwtTokenService.Generate(user);
        session.RefreshToken = await CreateTokenAsync(user.MaNguoiDung, "RefreshToken", TimeSpan.FromDays(30));
        return session;
    }

    public async Task SendVerificationEmailAsync(string email)
    {
        if (!IsValidEmail(email))
        {
            return;
        }

        var user = await _userRepository.GetByEmailAsync(email.Trim().ToLowerInvariant());
        if (user is null || user.EmailDaXacMinh)
        {
            return;
        }

        await SendVerificationEmailAsync(user);
    }

    public async Task VerifyEmailAsync(string token)
    {
        var maNguoiDung = await ConsumeTokenAsync("VerifyEmail", token);
        await _userRepository.MarkEmailVerifiedAsync(maNguoiDung);
    }

    public async Task SendPasswordResetEmailAsync(string email)
    {
        if (!IsValidEmail(email))
        {
            return;
        }

        var user = await _userRepository.GetByEmailAsync(email.Trim().ToLowerInvariant());
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return;
        }

        var token = await CreateTokenAsync(user.MaNguoiDung, "ResetPassword", TimeSpan.FromMinutes(30));
        var frontendBaseUrl = GetFrontendBaseUrl();
        var link = $"{frontendBaseUrl}/auth/reset-password?token={Uri.EscapeDataString(token)}";
        await _emailService.SendAsync(
            user.Email,
            "PetHealth - Đặt lại mật khẩu",
            $"""
            <h2>Đặt lại mật khẩu PetHealth</h2>
            <p>Xin chào {user.HoVaTen},</p>
            <p>Bạn vừa yêu cầu đặt lại mật khẩu. Đường dẫn dưới đây có hiệu lực trong 30 phút.</p>
            <p><a href="{link}">Đặt lại mật khẩu</a></p>
            <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
            """);
    }

    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
        {
            throw new InvalidOperationException("Mật khẩu mới phải có tối thiểu 6 ký tự.");
        }

        var maNguoiDung = await ConsumeTokenAsync("ResetPassword", token);
        await _userRepository.UpdatePasswordHashAsync(maNguoiDung, _passwordHasher.Hash(newPassword));
    }

    private async Task SendVerificationEmailAsync(NguoiDung user)
    {
        var token = await CreateTokenAsync(user.MaNguoiDung, "VerifyEmail", TimeSpan.FromHours(24));
        var frontendBaseUrl = GetFrontendBaseUrl();
        var link = $"{frontendBaseUrl}/auth/verify-email?token={Uri.EscapeDataString(token)}";
        await _emailService.SendAsync(
            user.Email,
            "PetHealth - Xác minh email",
            $"""
            <h2>Xác minh email PetHealth</h2>
            <p>Xin chào {user.HoVaTen},</p>
            <p>Vui lòng xác minh email để hoàn tất thông tin tài khoản.</p>
            <p><a href="{link}">Xác minh email</a></p>
            <p>Đường dẫn có hiệu lực trong 24 giờ.</p>
            """);
    }

    private async Task<string> CreateTokenAsync(string maNguoiDung, string tokenType, TimeSpan lifetime)
    {
        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        await _tokenRepository.CreateAsync(maNguoiDung, tokenType, HashToken(token), DateTime.UtcNow.Add(lifetime));
        return token;
    }

    private async Task<string> ConsumeTokenAsync(string tokenType, string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("Token không hợp lệ hoặc đã hết hạn.");
        }

        return await _tokenRepository.ConsumeAsync(tokenType, HashToken(token))
            ?? throw new InvalidOperationException("Token không hợp lệ hoặc đã hết hạn.");
    }

    private string GetFrontendBaseUrl()
    {
        return (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
    }

    private static string HashToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

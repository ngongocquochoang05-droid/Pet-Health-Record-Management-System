using MyPuppy.Admin.Controllers;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Services;

/// <summary>
/// Sync user tu frontend (sau khi Clerk login thanh cong) vao dbo.NguoiDung.
/// Idempotent — goi nhieu lan voi cung clerkUserId khong tao trung.
/// </summary>
public class AuthSyncService
{
    private readonly AdminRepository _repository;
    private readonly ILogger<AuthSyncService> _logger;

    public AuthSyncService(AdminRepository repository, ILogger<AuthSyncService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<UserDto> SyncFromFrontendAsync(SyncUserRequest payload)
    {
        // Sanitize input — frontend gui sao thi nhan vay nhung clean trim/null check.
        var fullName = (payload.FullName ?? string.Empty).Trim();
        var email = (payload.Email ?? string.Empty).Trim();
        var phone = (payload.Phone ?? string.Empty).Trim();
        var role = string.IsNullOrWhiteSpace(payload.Role) ? "customer" : payload.Role.Trim();

        await _repository.UpsertUserFromWebhookAsync(
            clerkUserId: payload.ClerkUserId,
            fullName: fullName,
            email: email,
            phone: phone,
            role: role,
            isActive: true,
            createdAt: null);

        _logger.LogInformation(
            "Da sync user {ClerkId} ({Email}) tu frontend -> dbo.NguoiDung.",
            payload.ClerkUserId, email);

        var user = await _repository.GetUserByIdAsync(payload.ClerkUserId);
        return user ?? throw new ServiceException(500, "Da sync nhung khong load lai duoc user.");
    }
}

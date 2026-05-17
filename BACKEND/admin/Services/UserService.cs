using MyPuppy.Admin.Models;
using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Services;

public class UserService
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "admin", "staff", "customer"
    };

    private readonly AdminRepository _repository;
    private readonly ClerkClient _clerkClient;

    public UserService(AdminRepository repository, ClerkClient clerkClient)
    {
        _repository = repository;
        _clerkClient = clerkClient;
    }

    public Task<IEnumerable<UserDto>> ListUsersAsync(string? role, string? status, string? search)
        => _repository.ListUsersAsync(role, status, search);

    public async Task<UserDto> GetUserByIdAsync(string id)
    {
        var user = await _repository.GetUserByIdAsync(id);
        if (user == null) throw new ServiceException(404, "User account not found.");
        return user;
    }

    public async Task<UserDto> UpdateRoleAsync(string id, string role)
    {
        if (string.IsNullOrWhiteSpace(role) || !AllowedRoles.Contains(role))
            throw new ServiceException(422, "Role must be admin, staff, or customer.");

        await GetUserByIdAsync(id);
        var updated = await _repository.UpdateUserAsync(id, role: role);
        return updated ?? throw new ServiceException(404, "User account not found.");
    }

    public async Task<(UserDto User, int Revoked, bool Skipped, string? Error)> SetUserActiveAsync(string id, bool isActive)
    {
        await GetUserByIdAsync(id);
        var status = isActive ? "active" : "locked";
        var updated = await _repository.UpdateUserAsync(id, status: status);
        if (updated == null) throw new ServiceException(404, "User account not found.");

        if (isActive)
            return (updated, 0, !_clerkClient.IsConfigured, null);

        var (revoked, skipped, error) = await _clerkClient.RevokeAllSessionsForUserAsync(id);
        return (updated, revoked, skipped, error);
    }
}

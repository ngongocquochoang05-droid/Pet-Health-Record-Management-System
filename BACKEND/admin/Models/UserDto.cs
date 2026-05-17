namespace MyPuppy.Admin.Models;

public record UserDto(
    string Id,
    string FullName,
    string Email,
    string Phone,
    string Address,
    string Gender,
    string Role,
    string Status,
    DateTime? CreatedAt
);

public record UpdateUserRoleRequest(string Role);

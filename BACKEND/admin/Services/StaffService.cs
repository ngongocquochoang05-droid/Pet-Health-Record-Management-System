using MyPuppy.Admin.Models;
using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Services;

public class StaffService
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "active", "inactive", "on_leave"
    };

    private readonly AdminRepository _repository;

    public StaffService(AdminRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<StaffDto>> ListStaffAsync(string? status, string? search)
        => _repository.ListStaffAsync(status, search);

    public async Task<StaffDto> GetStaffByIdAsync(string id)
    {
        var staff = await _repository.GetStaffByIdAsync(id);
        if (staff == null) throw new ServiceException(404, "Staff member not found.");
        return staff;
    }

    public async Task<StaffDto> UpdateStaffAsync(string id, UpdateStaffRequest payload)
    {
        ValidatePayload(payload);
        await GetStaffByIdAsync(id);
        var updated = await _repository.UpdateStaffAsync(id, payload);
        return updated ?? throw new ServiceException(404, "Staff member not found.");
    }

    public Task<StaffDto> SetAvailabilityAsync(string id, string status)
    {
        if (string.IsNullOrWhiteSpace(status) || !AllowedStatuses.Contains(status))
            throw new ServiceException(422, "Status must be active, inactive, or on_leave.");

        return UpdateStaffAsync(id, new UpdateStaffRequest(null, null, status));
    }

    private static void ValidatePayload(UpdateStaffRequest payload)
    {
        var errors = new Dictionary<string, string>();

        if (payload.Expertise != null && payload.Expertise.Trim().Length == 0)
            errors["expertise"] = "Chuyen mon khong duoc rong.";

        if (payload.YearsOfExperience.HasValue)
        {
            var years = payload.YearsOfExperience.Value;
            if (years < 0 || years > 80)
                errors["yearsOfExperience"] = "Nam kinh nghiem phai la so tu 0 den 80.";
        }

        if (payload.Status != null && !AllowedStatuses.Contains(payload.Status))
            errors["status"] = "Status must be active, inactive, or on_leave.";

        if (errors.Count > 0)
            throw new ServiceException(422, "Staff payload is invalid.", errors);
    }
}

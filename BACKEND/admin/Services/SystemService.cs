using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Services;

public class SystemService
{
    private static readonly DateTime StartedAtUtc = DateTime.UtcNow;

    private static readonly object[] Modules =
    {
        new { key = "auth",    name = "Xac thuc dang nhap (Clerk)", status = "ready" },
        new { key = "users",   name = "Tai khoan nguoi dung",       status = "ready" },
        new { key = "staff",   name = "Quan ly nhan vien",          status = "ready" },
        new { key = "reports", name = "Bao cao thong ke",           status = "ready" }
    };

    private readonly AdminRepository _repository;

    public SystemService(AdminRepository repository)
    {
        _repository = repository;
    }

    public object GetHealth() => new
    {
        service = "mypuppy-admin-backend",
        status = "ok",
        startedAt = StartedAtUtc.ToString("o"),
        checkedAt = DateTime.UtcNow.ToString("o")
    };

    public async Task<object> GetDashboardAsync()
    {
        var overview = await _repository.GetOverviewAsync();
        return new { overview, modules = Modules };
    }
}

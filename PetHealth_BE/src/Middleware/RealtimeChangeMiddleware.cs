using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using PetHealth_BE.src.Hubs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Middleware;

public class RealtimeChangeMiddleware
{
    private sealed record RealtimeScope(string Topic, string[] Groups);

    private static readonly HashSet<string> MutatingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    private readonly RequestDelegate _next;

    public RealtimeChangeMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IHubContext<PetHealthHub> hub,
        LichHenRepository bookingRepository)
    {
        await _next(context);

        if (!context.Request.Path.StartsWithSegments("/api")
            || !MutatingMethods.Contains(context.Request.Method)
            || context.Response.StatusCode >= 400)
        {
            return;
        }

        var scope = await ResolveScopeAsync(context, bookingRepository);
        if (scope is null)
        {
            return;
        }

        await hub.Clients.Groups(scope.Groups).SendAsync("DataChanged", new
        {
            topic = scope.Topic,
            resource = context.Request.Path.Value,
            method = context.Request.Method,
            changedAt = DateTime.UtcNow
        });
    }

    private static async Task<RealtimeScope?> ResolveScopeAsync(
        HttpContext context,
        LichHenRepository bookingRepository)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
        var actorId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var actorGroup = string.IsNullOrWhiteSpace(actorId) ? null : $"user:{actorId}";

        if (path.StartsWith("/api/auth"))
        {
            return null;
        }

        if (path.StartsWith("/api/dichvu") || path.StartsWith("/api/admin/services"))
        {
            return Scope("services", "authenticated");
        }

        if (path.StartsWith("/api/notifications"))
        {
            return Scope("notifications", actorGroup);
        }

        if (path.StartsWith("/api/lichhen") || path.Contains("/appointments"))
        {
            var bookingId = GetBookingId(context);
            var booking = bookingId.HasValue
                ? await bookingRepository.GetByIdAsync(bookingId.Value)
                : null;

            return booking is null
                ? Scope("bookings", actorGroup, "role:Admin", "role:Staff")
                : Scope(
                    "bookings",
                    $"user:{booking.MaNguoiDung}",
                    string.IsNullOrWhiteSpace(booking.MaNhanVien) ? null : $"user:{booking.MaNhanVien}",
                    "role:Admin");
        }

        if (path.StartsWith("/api/thucung"))
        {
            return Scope("pets", actorGroup, "role:Admin");
        }

        if (path.StartsWith("/api/clinical"))
        {
            return Scope("clinical", actorGroup, "role:Admin", "role:Staff");
        }

        if (path.StartsWith("/api/hoadon"))
        {
            return Scope("billing", actorGroup, "role:Admin", "role:Staff");
        }

        if (path.StartsWith("/api/advanced/pets"))
        {
            return Scope("clinical", actorGroup, "role:Admin", "role:Staff");
        }

        if (path.StartsWith("/api/advanced/reminders"))
        {
            return Scope("reminders", "role:Admin", "role:Staff");
        }

        if (path.StartsWith("/api/calam"))
        {
            return Scope("shifts", actorGroup, "role:Admin");
        }

        if (path.StartsWith("/api/admin"))
        {
            return Scope("admin", "role:Admin");
        }

        if (path.StartsWith("/api/nguoidung"))
        {
            return Scope("profile", actorGroup);
        }

        return Scope("system", actorGroup, "role:Admin");
    }

    private static int? GetBookingId(HttpContext context)
    {
        if (context.Request.RouteValues.TryGetValue("maLichHen", out var routeValue)
            && int.TryParse(routeValue?.ToString(), out var routeId))
        {
            return routeId;
        }

        var location = context.Response.Headers.Location.ToString();
        var lastSegment = location.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();
        return int.TryParse(lastSegment, out var locationId) ? locationId : null;
    }

    private static RealtimeScope Scope(string topic, params string?[] groups)
    {
        return new RealtimeScope(
            topic,
            groups
                .Where(group => !string.IsNullOrWhiteSpace(group))
                .Select(group => group!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray());
    }
}

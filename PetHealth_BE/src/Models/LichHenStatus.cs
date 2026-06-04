namespace PetHealth_BE.src.Models;

public static class LichHenStatus
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Cancelled = "Cancelled";
    public const string Completed = "Completed";
    public const string NoShow = "NO_SHOW";

    private static readonly HashSet<string> AllStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        Pending,
        Confirmed,
        Cancelled,
        Completed,
        NoShow
    };

    public static bool IsValid(string status)
    {
        return AllStatuses.Contains(status.Trim());
    }

    public static string Normalize(string status)
    {
        var trimmed = status.Trim();
        return AllStatuses.First(item => string.Equals(item, trimmed, StringComparison.OrdinalIgnoreCase));
    }
}

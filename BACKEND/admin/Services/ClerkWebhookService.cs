using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Services;

/// <summary>
/// Xu ly webhook Clerk de sync user -> dbo.NguoiDung.
/// Verify signature theo chuan Svix (https://docs.svix.com/receiving/verifying-payloads/how).
/// </summary>
public class ClerkWebhookService
{
    private static readonly TimeSpan TimestampTolerance = TimeSpan.FromMinutes(5);

    private readonly AdminRepository _repository;
    private readonly ILogger<ClerkWebhookService> _logger;
    private readonly string _signingSecret;

    public ClerkWebhookService(
        AdminRepository repository,
        IConfiguration configuration,
        ILogger<ClerkWebhookService> logger)
    {
        _repository = repository;
        _logger = logger;
        _signingSecret = configuration["Clerk:WebhookSecret"] ?? string.Empty;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_signingSecret);

    public bool VerifySignature(string svixId, string svixTimestamp, string svixSignature, string rawBody)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Clerk:WebhookSecret chua cau hinh - KHONG verify webhook.");
            return false;
        }

        if (string.IsNullOrEmpty(svixId) || string.IsNullOrEmpty(svixTimestamp) || string.IsNullOrEmpty(svixSignature))
            return false;

        if (!long.TryParse(svixTimestamp, out var ts))
            return false;
        var diff = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(ts);
        if (diff > TimestampTolerance || diff < -TimestampTolerance)
        {
            _logger.LogWarning("Webhook timestamp out of tolerance: {Diff}", diff);
            return false;
        }

        var secret = _signingSecret.StartsWith("whsec_", StringComparison.Ordinal)
            ? _signingSecret[6..]
            : _signingSecret;

        byte[] secretBytes;
        try
        {
            secretBytes = Convert.FromBase64String(secret);
        }
        catch (FormatException)
        {
            _logger.LogError("Clerk:WebhookSecret khong phai base64 hop le.");
            return false;
        }

        var signedPayload = $"{svixId}.{svixTimestamp}.{rawBody}";
        using var hmac = new HMACSHA256(secretBytes);
        var expectedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        var expectedSignature = Convert.ToBase64String(expectedHash);

        var signatures = svixSignature.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        foreach (var entry in signatures)
        {
            var parts = entry.Split(',', 2);
            if (parts.Length != 2) continue;
            if (CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(parts[1]),
                Encoding.UTF8.GetBytes(expectedSignature)))
            {
                return true;
            }
        }
        return false;
    }

    public async Task ProcessAsync(string rawBody)
    {
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;

        if (!root.TryGetProperty("type", out var typeElement))
        {
            _logger.LogWarning("Webhook payload thieu field 'type'.");
            return;
        }

        var eventType = typeElement.GetString() ?? string.Empty;
        if (!root.TryGetProperty("data", out var data))
        {
            _logger.LogWarning("Webhook event {Type} thieu field 'data'.", eventType);
            return;
        }

        switch (eventType)
        {
            case "user.created":
            case "user.updated":
                await ApplyUserDataAsync(data);
                break;
            case "user.deleted":
                await DeleteUserAsync(data);
                break;
            default:
                _logger.LogInformation("Webhook event {Type} - bo qua.", eventType);
                break;
        }
    }

    /// <summary>
    /// Map Clerk user JSON -> dbo.NguoiDung va upsert. Dung cho ca webhook va manual sync.
    /// </summary>
    public async Task ApplyUserDataAsync(JsonElement data)
    {
        var clerkId = GetString(data, "id");
        if (string.IsNullOrEmpty(clerkId)) return;

        var firstName = GetString(data, "first_name");
        var lastName = GetString(data, "last_name");
        var fullName = string.Join(" ", new[] { firstName, lastName }
            .Where(s => !string.IsNullOrWhiteSpace(s)));

        if (string.IsNullOrWhiteSpace(fullName))
        {
            fullName = GetString(data, "username") ?? string.Empty;
        }

        string email = string.Empty;
        if (data.TryGetProperty("email_addresses", out var emails) && emails.ValueKind == JsonValueKind.Array)
        {
            string? primaryEmailId = data.TryGetProperty("primary_email_address_id", out var primId)
                ? primId.GetString()
                : null;

            foreach (var emailObj in emails.EnumerateArray())
            {
                var emailId = GetString(emailObj, "id");
                var emailAddr = GetString(emailObj, "email_address");
                if (emailAddr == null) continue;

                if (primaryEmailId != null && emailId == primaryEmailId)
                {
                    email = emailAddr;
                    break;
                }
                if (string.IsNullOrEmpty(email)) email = emailAddr;
            }
        }

        string phone = string.Empty;
        if (data.TryGetProperty("phone_numbers", out var phones) && phones.ValueKind == JsonValueKind.Array)
        {
            foreach (var phoneObj in phones.EnumerateArray())
            {
                var p = GetString(phoneObj, "phone_number");
                if (!string.IsNullOrEmpty(p))
                {
                    phone = p;
                    break;
                }
            }
        }

        string? role = null;
        if (data.TryGetProperty("public_metadata", out var meta) && meta.ValueKind == JsonValueKind.Object
            && meta.TryGetProperty("role", out var roleEl) && roleEl.ValueKind == JsonValueKind.String)
        {
            role = roleEl.GetString();
        }

        bool isActive = true;
        if (data.TryGetProperty("banned", out var banned) && banned.ValueKind == JsonValueKind.True)
            isActive = false;
        if (data.TryGetProperty("locked", out var locked) && locked.ValueKind == JsonValueKind.True)
            isActive = false;

        DateTime? createdAt = null;
        if (data.TryGetProperty("created_at", out var createdEl) && createdEl.ValueKind == JsonValueKind.Number
            && createdEl.TryGetInt64(out var unixMs))
        {
            createdAt = DateTimeOffset.FromUnixTimeMilliseconds(unixMs).UtcDateTime;
        }

        await _repository.UpsertUserFromWebhookAsync(
            clerkUserId: clerkId,
            fullName: fullName,
            email: email,
            phone: phone,
            role: role,
            isActive: isActive,
            createdAt: createdAt);

        _logger.LogInformation("Da sync Clerk user {ClerkId} ({Email}) -> dbo.NguoiDung.", clerkId, email);
    }

    private async Task DeleteUserAsync(JsonElement data)
    {
        var clerkId = GetString(data, "id");
        if (string.IsNullOrEmpty(clerkId)) return;

        await _repository.DeleteUserByClerkIdAsync(clerkId);
        _logger.LogInformation("Da xoa Clerk user {ClerkId} khoi dbo.NguoiDung.", clerkId);
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object) return null;
        if (!element.TryGetProperty(propertyName, out var prop)) return null;
        return prop.ValueKind == JsonValueKind.String ? prop.GetString() : null;
    }
}

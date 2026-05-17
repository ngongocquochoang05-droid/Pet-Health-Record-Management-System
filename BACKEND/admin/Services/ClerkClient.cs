using System.Net.Http.Headers;
using System.Text.Json;

namespace MyPuppy.Admin.Services;

public class ClerkClient
{
    private const string ClerkApiBase = "https://api.clerk.com/v1";

    private readonly HttpClient _httpClient;
    private readonly string _secretKey;
    private readonly ILogger<ClerkClient> _logger;

    public ClerkClient(HttpClient httpClient, IConfiguration configuration, ILogger<ClerkClient> logger)
    {
        _httpClient = httpClient;
        _secretKey = configuration["Clerk:SecretKey"] ?? string.Empty;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_secretKey);

    public async Task<(int Revoked, bool Skipped, string? Error)> RevokeAllSessionsForUserAsync(string userId)
    {
        if (!IsConfigured)
        {
            return (0, true, null);
        }

        try
        {
            var sessions = await ListSessionsAsync(userId);
            int revoked = 0;
            foreach (var sessionId in sessions)
            {
                try
                {
                    await RevokeSessionAsync(sessionId);
                    revoked++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Khong revoke duoc Clerk session {SessionId}", sessionId);
                }
            }
            return (revoked, false, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Loi khi goi Clerk Backend API cho user {UserId}", userId);
            return (0, true, ex.Message);
        }
    }

    private async Task<List<string>> ListSessionsAsync(string userId)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{ClerkApiBase}/sessions?user_id={Uri.EscapeDataString(userId)}&status=active");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _secretKey);

        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);

        var root = doc.RootElement;
        var sessionIds = new List<string>();

        // Clerk có thể trả mảng trực tiếp hoặc { data: [...] }
        JsonElement array;
        if (root.ValueKind == JsonValueKind.Array)
        {
            array = root;
        }
        else if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Array)
        {
            array = data;
        }
        else
        {
            return sessionIds;
        }

        foreach (var session in array.EnumerateArray())
        {
            if (session.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String)
            {
                sessionIds.Add(id.GetString()!);
            }
        }
        return sessionIds;
    }

    private async Task RevokeSessionAsync(string sessionId)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{ClerkApiBase}/sessions/{Uri.EscapeDataString(sessionId)}/revoke");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _secretKey);

        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }
}

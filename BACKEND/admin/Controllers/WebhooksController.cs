using Microsoft.AspNetCore.Mvc;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Services;

namespace MyPuppy.Admin.Controllers;

[ApiController]
[Route("api/admin/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly ClerkWebhookService _webhookService;
    private readonly ClerkClient _clerkClient;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        ClerkWebhookService webhookService,
        ClerkClient clerkClient,
        ILogger<WebhooksController> logger)
    {
        _webhookService = webhookService;
        _clerkClient = clerkClient;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/admin/webhooks/clerk
    /// Clerk se goi endpoint nay khi co event user.created/updated/deleted.
    /// </summary>
    [HttpPost("clerk")]
    public async Task<IActionResult> Clerk()
    {
        if (!_webhookService.IsConfigured)
        {
            _logger.LogWarning("Webhook endpoint goi nhung Clerk:WebhookSecret chua duoc cau hinh.");
            return StatusCode(503, ApiResponse<object>.Fail(
                "Webhook chua duoc kich hoat. Cau hinh Clerk:WebhookSecret trong appsettings.json."));
        }

        Request.EnableBuffering();
        string rawBody;
        Request.Body.Position = 0;
        using (var reader = new StreamReader(Request.Body, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        var svixId = Request.Headers["svix-id"].ToString();
        var svixTimestamp = Request.Headers["svix-timestamp"].ToString();
        var svixSignature = Request.Headers["svix-signature"].ToString();

        if (!_webhookService.VerifySignature(svixId, svixTimestamp, svixSignature, rawBody))
        {
            _logger.LogWarning("Webhook signature verification failed. svix-id={SvixId}", svixId);
            return Unauthorized(ApiResponse<object>.Fail("Invalid webhook signature."));
        }

        try
        {
            await _webhookService.ProcessAsync(rawBody);
            return Ok(ApiResponse<object>.Ok(new { received = true }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi xu ly Clerk webhook.");
            return StatusCode(500, ApiResponse<object>.Fail("Failed to process webhook."));
        }
    }

    /// <summary>
    /// POST /api/admin/webhooks/clerk/sync
    /// Manual sync: keo tat ca user tu Clerk Backend API ve dbo.NguoiDung.
    /// Dung khi webhook chua hoat dong, hoac de fix data dong bo.
    /// </summary>
    [HttpPost("clerk/sync")]
    public async Task<IActionResult> ManualSync()
    {
        if (!_clerkClient.IsConfigured)
        {
            return StatusCode(503, ApiResponse<object>.Fail(
                "Clerk:SecretKey chua duoc cau hinh trong appsettings.json. " +
                "Lay key tai Clerk Dashboard -> API Keys -> Secret keys."));
        }

        try
        {
            var users = await _clerkClient.ListAllUsersAsync();
            int synced = 0;
            var failures = new List<string>();

            foreach (var user in users)
            {
                try
                {
                    await _webhookService.ApplyUserDataAsync(user);
                    synced++;
                }
                catch (Exception ex)
                {
                    var id = user.TryGetProperty("id", out var idEl) ? idEl.GetString() : "?";
                    failures.Add($"{id}: {ex.Message}");
                    _logger.LogError(ex, "Sync that bai cho user {ClerkId}", id);
                }
            }

            return Ok(ApiResponse<object>.Ok(new
            {
                totalFromClerk = users.Count,
                synced,
                failed = failures.Count,
                failures
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Manual sync that bai.");
            return StatusCode(500, ApiResponse<object>.Fail($"Manual sync failed: {ex.Message}"));
        }
    }
}

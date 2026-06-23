using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace PetHealth_BE.src.Services;

public interface IEmailService
{
    Task SendAsync(string toEmail, string subject, string htmlBody, IReadOnlyCollection<InlineEmailImage>? inlineImages = null);
}

public record InlineEmailImage(string ContentId, byte[] Content, string MediaType);

public class EmailConfigurationException : InvalidOperationException
{
    public EmailConfigurationException(string message) : base(message)
    {
    }
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly HttpClient _httpClient;

    public EmailService(IOptions<EmailSettings> options, HttpClient httpClient)
    {
        _settings = options.Value;
        _httpClient = httpClient;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, IReadOnlyCollection<InlineEmailImage>? inlineImages = null)
    {
        if (!string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            await SendWithBrevoApiAsync(toEmail, subject, htmlBody, inlineImages);
            return;
        }

        await SendWithSmtpAsync(toEmail, subject, htmlBody, inlineImages);
    }

    private async Task SendWithBrevoApiAsync(string toEmail, string subject, string htmlBody, IReadOnlyCollection<InlineEmailImage>? inlineImages)
    {
        var apiKey = _settings.ApiKey.Trim();
        var apiUrl = string.IsNullOrWhiteSpace(_settings.ApiUrl)
            ? "https://api.brevo.com/v3/smtp/email"
            : _settings.ApiUrl.Trim();
        var fromEmail = GetFromEmail();

        if (IsPlaceholder(apiKey))
        {
            throw new EmailConfigurationException("Email:ApiKey van la gia tri mau, hay dien Brevo API key that trong appsettings.Local.json.");
        }

        if (!MailAddress.TryCreate(fromEmail, out _))
        {
            throw new EmailConfigurationException("Email:FromEmail khong dung dinh dang email.");
        }

        if (!MailAddress.TryCreate(toEmail, out _))
        {
            throw new InvalidOperationException($"Email nguoi nhan khong dung dinh dang: {toEmail}");
        }

        var request = new BrevoEmailRequest
        {
            Sender = new BrevoEmailAddress(_settings.FromName, fromEmail),
            To = [new BrevoEmailAddress(null, toEmail.Trim())],
            Subject = subject,
            HtmlContent = htmlBody,
            Attachment = inlineImages?
                .Select((image, index) => new BrevoAttachment(
                    $"pethealth-qr-{index + 1}.{GetFileExtension(image.MediaType)}",
                    Convert.ToBase64String(image.Content)))
                .ToList()
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, apiUrl)
        {
            Content = JsonContent.Create(request)
        };
        httpRequest.Headers.Add("api-key", apiKey);

        using var response = await _httpClient.SendAsync(httpRequest);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            throw new EmailConfigurationException($"Brevo API khong gui duoc email. StatusCode: {(int)response.StatusCode}. Noi dung loi: {responseBody}");
        }
    }

    private async Task SendWithSmtpAsync(string toEmail, string subject, string htmlBody, IReadOnlyCollection<InlineEmailImage>? inlineImages)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost) ||
            string.IsNullOrWhiteSpace(_settings.Username) ||
            string.IsNullOrWhiteSpace(_settings.Password))
        {
            throw new EmailConfigurationException("Chua cau hinh Email:SmtpHost, Email:Username hoac Email:Password.");
        }

        var smtpUsername = _settings.Username.Trim();
        var smtpPassword = NormalizePassword(_settings.Password);
        var fromEmail = GetFromEmail();

        if (IsPlaceholder(smtpUsername) || IsPlaceholder(smtpPassword))
        {
            throw new EmailConfigurationException("Email:Username hoac Email:Password van la gia tri mau, hay dien thong tin SMTP that trong appsettings.Local.json.");
        }

        if (!MailAddress.TryCreate(fromEmail, _settings.FromName, out var fromAddress))
        {
            throw new EmailConfigurationException("Email:FromEmail khong dung dinh dang email.");
        }

        if (!MailAddress.TryCreate(toEmail, out var toAddress))
        {
            throw new InvalidOperationException($"Email nguoi nhan khong dung dinh dang: {toEmail}");
        }

        using var message = new MailMessage
        {
            From = fromAddress,
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(toAddress);
        AddInlineImages(message, htmlBody, inlineImages);

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = true,
            UseDefaultCredentials = false,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Credentials = new NetworkCredential(smtpUsername, smtpPassword)
        };

        try
        {
            await client.SendMailAsync(message);
        }
        catch (SmtpException ex) when (ex.Message.Contains("5.7.0", StringComparison.OrdinalIgnoreCase) ||
                                      ex.Message.Contains("Authentication Required", StringComparison.OrdinalIgnoreCase) ||
                                      ex.Message.Contains("Authentication failed", StringComparison.OrdinalIgnoreCase) ||
                                      ex.Message.Contains("Invalid username or password", StringComparison.OrdinalIgnoreCase))
        {
            throw new EmailConfigurationException($"May chu SMTP {_settings.SmtpHost} khong chap nhan dang nhap. Loi SMTP: {ex.Message}");
        }
        catch (SmtpException ex)
        {
            throw new EmailConfigurationException($"Khong gui duoc email qua SMTP {_settings.SmtpHost}. StatusCode: {ex.StatusCode}. Loi SMTP: {ex.Message}");
        }
    }

    private static void AddInlineImages(MailMessage message, string htmlBody, IReadOnlyCollection<InlineEmailImage>? inlineImages)
    {
        if (inlineImages is null || inlineImages.Count == 0)
        {
            return;
        }

        var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, null, MediaTypeNames.Text.Html);
        foreach (var image in inlineImages)
        {
            var resource = new LinkedResource(new MemoryStream(image.Content), image.MediaType)
            {
                ContentId = image.ContentId,
                TransferEncoding = TransferEncoding.Base64
            };
            htmlView.LinkedResources.Add(resource);
        }

        message.AlternateViews.Add(htmlView);
    }

    private static bool IsPlaceholder(string value)
    {
        var trimmed = value.Trim();
        return trimmed.StartsWith("__", StringComparison.Ordinal) && trimmed.EndsWith("__", StringComparison.Ordinal);
    }

    private static string NormalizePassword(string value)
    {
        return new string(value.Where(character => !char.IsWhiteSpace(character)).ToArray());
    }

    private string GetFromEmail()
    {
        return string.IsNullOrWhiteSpace(_settings.FromEmail)
            ? _settings.Username.Trim()
            : _settings.FromEmail.Trim();
    }

    private static string GetFileExtension(string mediaType)
    {
        return mediaType.ToLowerInvariant() switch
        {
            "image/jpeg" => "jpg",
            "image/jpg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            _ => "bin"
        };
    }
}

public class BrevoEmailRequest
{
    [JsonPropertyName("sender")]
    public BrevoEmailAddress Sender { get; set; } = new(null, string.Empty);

    [JsonPropertyName("to")]
    public List<BrevoEmailAddress> To { get; set; } = [];

    [JsonPropertyName("subject")]
    public string Subject { get; set; } = string.Empty;

    [JsonPropertyName("htmlContent")]
    public string HtmlContent { get; set; } = string.Empty;

    [JsonPropertyName("attachment")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<BrevoAttachment>? Attachment { get; set; }
}

public record BrevoEmailAddress(
    [property: JsonPropertyName("name")]
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    string? Name,
    [property: JsonPropertyName("email")] string Email);

public record BrevoAttachment(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("content")] string Content);

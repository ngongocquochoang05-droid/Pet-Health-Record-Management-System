using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace PetHealth_BE.src.Services;

public interface IEmailService
{
    Task SendAsync(string toEmail, string subject, string htmlBody);
}

public class EmailConfigurationException : InvalidOperationException
{
    public EmailConfigurationException(string message) : base(message)
    {
    }
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost) ||
            string.IsNullOrWhiteSpace(_settings.Username) ||
            string.IsNullOrWhiteSpace(_settings.Password))
        {
            throw new EmailConfigurationException("Chua cau hinh Email:SmtpHost, Email:Username hoac Email:Password.");
        }

        if (IsPlaceholder(_settings.Username) || IsPlaceholder(_settings.Password))
        {
            throw new EmailConfigurationException("Email:Username hoac Email:Password van la gia tri mau, hay dien thong tin SMTP that trong appsettings.Local.json.");
        }

        if (!MailAddress.TryCreate(_settings.Username, _settings.FromName, out var fromAddress))
        {
            throw new EmailConfigurationException("Email:Username khong dung dinh dang email.");
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

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_settings.Username, _settings.Password)
        };

        await client.SendMailAsync(message);
    }

    private static bool IsPlaceholder(string value)
    {
        var trimmed = value.Trim();
        return trimmed.StartsWith("__", StringComparison.Ordinal) && trimmed.EndsWith("__", StringComparison.Ordinal);
    }
}

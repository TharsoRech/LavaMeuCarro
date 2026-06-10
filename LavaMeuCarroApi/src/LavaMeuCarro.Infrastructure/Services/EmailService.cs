using LavaMeuCarro.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LavaMeuCarro.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly IConfiguration _config;

    public SmtpEmailService(ILogger<SmtpEmailService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public Task SendVerificationEmailAsync(string email, string code)
    {
        _logger.LogInformation("Verification email to {Email}: code {Code}", email, code);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetEmailAsync(string email, string code)
    {
        _logger.LogInformation("Password reset email to {Email}: code {Code}", email, code);
        return Task.CompletedTask;
    }

    public Task SendAppointmentEmailAsync(string email, string subject, string body)
    {
        _logger.LogInformation("Appointment email to {Email}: {Subject}", email, subject);
        return Task.CompletedTask;
    }
}

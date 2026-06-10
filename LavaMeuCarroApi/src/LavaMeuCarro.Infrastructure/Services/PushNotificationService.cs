using LavaMeuCarro.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace LavaMeuCarro.Infrastructure.Services;

public class FirebasePushNotificationService : IPushNotificationService
{
    private readonly ILogger<FirebasePushNotificationService> _logger;

    public FirebasePushNotificationService(ILogger<FirebasePushNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendPushAsync(int userId, string title, string body, Dictionary<string, string>? data)
    {
        _logger.LogInformation("Push to user {UserId}: {Title} - {Body}", userId, title, body);
        return Task.CompletedTask;
    }

    public Task SendToTokenAsync(string token, string title, string body, Dictionary<string, string>? data)
    {
        _logger.LogInformation("Push to token: {Title} - {Body}", title, body);
        return Task.CompletedTask;
    }
}

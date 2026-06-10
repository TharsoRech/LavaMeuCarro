using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/marketing")]
[Authorize]
public class MarketingController : ControllerBase
{
    private readonly IPushNotificationService _pushService;
    private readonly INotificacaoRepository _notificacaoRepo;
    private readonly IPushDeviceTokenRepository _deviceTokenRepo;

    public MarketingController(
        IPushNotificationService pushService,
        INotificacaoRepository notificacaoRepo,
        IPushDeviceTokenRepository deviceTokenRepo)
    {
        _pushService = pushService;
        _notificacaoRepo = notificacaoRepo;
        _deviceTokenRepo = deviceTokenRepo;
    }

    [HttpPost("broadcast")]
    public async Task<ActionResult> Broadcast([FromBody] BroadcastRequest request)
    {
        // Get all active device tokens
        var tokens = await _deviceTokenRepo.GetAllActiveAsync();
        var sentCount = 0;

        foreach (var token in tokens)
        {
            try
            {
                await _pushService.SendToTokenAsync(
                    token.DeviceToken,
                    request.Title,
                    request.Message,
                    new Dictionary<string, string>
                    {
                        ["type"] = "marketing",
                        ["targetAudience"] = request.TargetAudience,
                        ["targetUnitId"] = request.TargetUnitId?.ToString() ?? ""
                    });
                sentCount++;
            }
            catch
            {
                // Log and continue - don't fail on individual token errors
            }
        }

        // Create a notification record for audit (use UserId 0 for system broadcasts)
        await _notificacaoRepo.CreateAsync(new Notificacao
        {
            UserId = 0,
            Title = request.Title,
            Body = request.Message,
            Type = NotificationType.Promotion,
            ReferenceType = "marketing_broadcast",
            CreatedAt = DateTime.UtcNow
        });

        return Ok(new
        {
            success = true,
            message = $"Broadcast sent to {sentCount} devices",
            sentCount,
            totalDevices = tokens.Count
        });
    }
}

public record BroadcastRequest(string Title, string Message, string TargetAudience, int? TargetUnitId);

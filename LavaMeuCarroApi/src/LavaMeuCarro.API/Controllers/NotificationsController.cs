using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Domain.Entities;
using System.Security.Claims;

namespace LavaMeuCarro.API.Controllers;

public record RegisterPushDeviceRequest(
    string? DeviceToken,
    string Platform = "android",
    string? Provider = null,
    string? DeviceId = null);

public record UnregisterPushDeviceRequest(string? DeviceToken, string? Provider = null);

/// <summary>User notifications and push device management</summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IPushDeviceTokenRepository _deviceTokenRepo;
    private readonly INotificacaoRepository _notificacaoRepo;

    public NotificationsController(
        IPushDeviceTokenRepository deviceTokenRepo,
        INotificacaoRepository notificacaoRepo)
    {
        _deviceTokenRepo = deviceTokenRepo;
        _notificacaoRepo = notificacaoRepo;
    }

    private int UserId
    {
        get
        {
            var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? User.FindFirstValue("id");

            return int.TryParse(claimValue, out var userId)
                ? userId
                : 0;
        }
    }

    /// <summary>List my notifications</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<NotificacaoDTO>), 200)]
    public async Task<IActionResult> List()
    {
        var notifications = await _notificacaoRepo.GetByUserAsync(UserId);
        var dtos = notifications.Select(n => new NotificacaoDTO(
            n.Id,
            n.UserId,
            n.Title,
            n.Body,
            n.Type.ToString(),
            n.IsRead,
            n.ReferenceId,
            n.ReferenceType,
            n.CreatedAt
        )).ToList();
        
        return Ok(dtos);
    }

    /// <summary>Get unread notifications count</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> UnreadCount()
    {
        var count = await _notificacaoRepo.CountUnreadAsync(UserId);
        return Ok(new { count });
    }

    /// <summary>Mark a notification as read</summary>
    [HttpPut("{id}/read")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        if (int.TryParse(id, out var notificationId))
        {
            await _notificacaoRepo.MarkReadAsync(notificationId);
        }
        return NoContent();
    }

    /// <summary>Mark all notifications as read</summary>
    [HttpPut("read-all")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificacaoRepo.MarkAllReadAsync(UserId);
        return NoContent();
    }

    /// <summary>Register or refresh the authenticated user's push device token</summary>
    [HttpPost("push-device/register")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> RegisterPushDevice([FromBody] RegisterPushDeviceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceToken))
            return BadRequest("deviceToken is required.");

        var token = new PushDeviceToken
        {
            UserId = UserId > 0 ? UserId : 0, // Will be 0 if not authenticated
            DeviceToken = request.DeviceToken.Trim(),
            Provider = request.Provider ?? "fcm",
            Platform = request.Platform ?? "android",
            DeviceId = request.DeviceId,
            Active = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _deviceTokenRepo.UpsertAsync(token);

        return Ok(new { registered = true });
    }

    /// <summary>Unregister the authenticated user's push device token</summary>
    [HttpPost("push-device/unregister")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> UnregisterPushDevice([FromBody] UnregisterPushDeviceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceToken))
            return BadRequest("deviceToken is required.");

        await _deviceTokenRepo.RemoveByDeviceIdAsync(request.DeviceToken.Trim());

        return Ok(new { unregistered = true });
    }
}



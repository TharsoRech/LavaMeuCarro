using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using System.Security.Claims;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("telemetry")]
[Authorize]
public class TelemetryController : ControllerBase
{
    private readonly INewRelicLogService _newRelicLogService;
    private readonly ILogger<TelemetryController> _logger;

    public TelemetryController(
        INewRelicLogService newRelicLogService,
        ILogger<TelemetryController> logger)
    {
        _newRelicLogService = newRelicLogService;
        _logger = logger;
    }

    [HttpPost("mobile-log")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> LogMobileTelemetry([FromBody] MobileTelemetryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest("message is required.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("userId")
                     ?? "anonymous";

        var source = $"mobile.{request.Platform}.{request.Context}";

        var attributes = new Dictionary<string, object?>
        {
            ["platform"] = request.Platform,
            ["appVersion"] = request.AppVersion,
            ["appBuildNumber"] = request.AppBuildNumber,
            ["appVersionLabel"] = request.AppVersionLabel,
            ["clientTimestamp"] = request.ClientTimestamp,
            ["deviceModel"] = request.Device?.deviceModel,
            ["osVersion"] = request.Device?.osVersion,
            ["osName"] = request.Device?.osName
        };

        try
        {
            await _newRelicLogService.LogAsync(
                request.Level,
                request.Message,
                source,
                userId,
                attributes);

            return Ok(new { logged = true });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log mobile telemetry. source={Source}", source);
            // Never break app flow - always return success even if logging fails
            return Ok(new { logged = false });
        }
    }
}

public class MobileTelemetryRequest
{
    public string Level { get; set; } = string.Empty; // Error, Warning, Information
    public string Message { get; set; } = string.Empty;
    public string? Context { get; set; }
    public string? Stack { get; set; }
    public string Platform { get; set; } = string.Empty; // android, ios
    public string? AppVersion { get; set; }
    public string? AppBuildNumber { get; set; }
    public string? AppVersionLabel { get; set; }
    public string? ClientTimestamp { get; set; }
    public MobileDeviceInfo? Device { get; set; }
}

public class MobileDeviceInfo
{
    public string? deviceModel { get; set; }
    public string? deviceBrand { get; set; }
    public string? deviceManufacturer { get; set; }
    public string? osName { get; set; }
    public string? osVersion { get; set; }
    public string? osBuildId { get; set; }
    public bool? isDevice { get; set; }
    public int? totalMemory { get; set; }
}

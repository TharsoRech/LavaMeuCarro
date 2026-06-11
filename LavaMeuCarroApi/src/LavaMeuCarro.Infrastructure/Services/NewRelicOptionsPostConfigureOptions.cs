using LavaMeuCarro.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace LavaMeuCarro.Infrastructure.Services;

public class NewRelicOptionsPostConfigureOptions : IPostConfigureOptions<NewRelicOptions>
{
    private readonly ISupportSettingRepository _supportSettingRepo;

    public NewRelicOptionsPostConfigureOptions(ISupportSettingRepository supportSettingRepo)
    {
        _supportSettingRepo = supportSettingRepo;
    }

    public void PostConfigure(string? name, NewRelicOptions options)
    {
        // Load from SupportSettings database (synchronous for startup)
        var enabled = _supportSettingRepo.GetValueAsync("newrelic.enabled").GetAwaiter().GetResult();
        var apiKey = _supportSettingRepo.GetValueAsync("newrelic.apiKey").GetAwaiter().GetResult();
        var appName = _supportSettingRepo.GetValueAsync("newrelic.appName").GetAwaiter().GetResult();
        var endpoint = _supportSettingRepo.GetValueAsync("newrelic.endpoint").GetAwaiter().GetResult();
        var environment = _supportSettingRepo.GetValueAsync("newrelic.environment").GetAwaiter().GetResult();
        var region = _supportSettingRepo.GetValueAsync("newrelic.region").GetAwaiter().GetResult();

        options.Enabled = bool.TryParse(enabled, out var enabledBool) ? enabledBool : false;
        options.ApiKey = apiKey ?? string.Empty;
        options.AppName = appName ?? "LavaMeuCarroApi";
        options.Endpoint = endpoint ?? "https://log-api.newrelic.com/log/v1";
        options.Environment = environment ?? "production";
        options.Region = region ?? "US";
    }
}

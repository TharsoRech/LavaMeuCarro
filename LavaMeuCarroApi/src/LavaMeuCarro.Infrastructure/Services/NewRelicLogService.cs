using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using LavaMeuCarro.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LavaMeuCarro.Infrastructure.Services;

public sealed class NewRelicLogService(
    IHttpClientFactory httpClientFactory,
    IOptions<NewRelicOptions> options,
    ILogger<NewRelicLogService> logger) : INewRelicLogService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task LogAsync(
        string level,
        string message,
        string source,
        string? userId = null,
        Dictionary<string, object?>? attributes = null,
        CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (!settings.Enabled)
            return;

        var apiKey = ResolveApiKey(settings);
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("New Relic ativo, mas sem API key configurada. source={Source}", source);
            return;
        }

        var endpoint = ResolveEndpoint(settings);
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri))
        {
            logger.LogWarning("Endpoint New Relic invalido: {Endpoint}", endpoint);
            return;
        }

        var eventAttributes = new Dictionary<string, object?>
        {
            ["source"] = source,
            ["appName"] = settings.AppName,
            ["environment"] = settings.Environment,
            ["region"] = settings.Region,
            ["level"] = level
        };

        if (!string.IsNullOrWhiteSpace(userId))
        {
            eventAttributes["userId"] = userId;
        }

        if (attributes is not null)
        {
            foreach (var (key, value) in attributes)
            {
                if (!string.IsNullOrWhiteSpace(key))
                    eventAttributes[key] = value;
            }
        }

        var payload = new[]
        {
            new
            {
                common = new
                {
                    attributes = new
                    {
                        service = settings.AppName,
                        environment = settings.Environment,
                        source
                    }
                },
                logs = new[]
                {
                    new
                    {
                        timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                        message,
                        attributes = eventAttributes
                    }
                }
            }
        };

        try
        {
            var httpClient = httpClientFactory.CreateClient("NewRelicIngest");
            using var request = new HttpRequestMessage(HttpMethod.Post, endpointUri)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json")
            };
            request.Headers.Add("Api-Key", apiKey);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogWarning(
                    "Falha ao enviar log para New Relic. status={StatusCode} source={Source} body={Body}",
                    (int)response.StatusCode,
                    source,
                    body);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Erro ao chamar API de logs da New Relic. source={Source}", source);
        }
    }

    private static string? ResolveApiKey(NewRelicOptions settings)
    {
        if (!string.IsNullOrWhiteSpace(settings.ApiKey))
            return settings.ApiKey;

        var fromEnv = Environment.GetEnvironmentVariable("NEW_RELIC_API_KEY")
                      ?? Environment.GetEnvironmentVariable("NEW_RELIC_LICENSE_KEY");

        return string.IsNullOrWhiteSpace(fromEnv) ? null : fromEnv;
    }

    private static string ResolveEndpoint(NewRelicOptions settings)
    {
        if (!string.IsNullOrWhiteSpace(settings.Endpoint))
            return settings.Endpoint;

        return string.Equals(settings.Region, "US", StringComparison.OrdinalIgnoreCase)
            ? "https://log-api.newrelic.com/log/v1"
            : "https://log-api.eu.newrelic.com/log/v1";
    }
}

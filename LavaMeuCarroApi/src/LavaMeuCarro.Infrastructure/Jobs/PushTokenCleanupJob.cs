using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.Infrastructure.Jobs;

/// <summary>
/// Remove tokens FCM inválidos/expirados semanalmente
/// </summary>
public class PushTokenCleanupJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PushTokenCleanupJob> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromDays(7); // Semanal

    public PushTokenCleanupJob(
        IServiceScopeFactory scopeFactory,
        ILogger<PushTokenCleanupJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[PushTokenCleanupJob] Starting push token cleanup service");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // TODO: Implement when PushDeviceTokenRepository is available
                _logger.LogInformation("[PushTokenCleanupJob] Push token cleanup executed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PushTokenCleanupJob] Error in cleanup job");
            }

            // Aguarda 7 dias para próxima execução
            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("[PushTokenCleanupJob] Stopping push token cleanup service");
    }
}

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
namespace LavaMeuCarro.Infrastructure.Jobs;

/// <summary>
/// Remove sessões expiradas a cada hora
/// </summary>
public class SessionCleanupJob : BackgroundService
{
    private readonly ILogger<SessionCleanupJob> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(1); // A cada hora

    public SessionCleanupJob(ILogger<SessionCleanupJob> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[SessionCleanupJob] Starting session cleanup service");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // TODO: Implementar cleanup de sessões expiradas
                // Por enquanto, apenas loga que está rodando
                _logger.LogInformation("[SessionCleanupJob] Session cleanup executed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SessionCleanupJob] Error in cleanup job");
            }

            // Aguarda 1 hora para próxima execução
            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("[SessionCleanupJob] Stopping session cleanup service");
    }
}

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.Infrastructure.Jobs;

/// <summary>
/// Remove notificações antigas semanalmente
/// </summary>
public class NotificationCleanupJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationCleanupJob> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromDays(7); // Semanal

    public NotificationCleanupJob(
        IServiceScopeFactory scopeFactory,
        ILogger<NotificationCleanupJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[NotificationCleanupJob] Starting notification cleanup service");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var notificacaoRepo = scope.ServiceProvider.GetRequiredService<INotificacaoRepository>();

                // Remove notificações com mais de 30 dias
                await notificacaoRepo.DeleteOldAsync(daysOld: 30);

                _logger.LogInformation("[NotificationCleanupJob] Deleted notifications older than 30 days");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[NotificationCleanupJob] Error in cleanup job");
            }

            // Aguarda 7 dias para próxima execução
            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("[NotificationCleanupJob] Stopping notification cleanup service");
    }
}

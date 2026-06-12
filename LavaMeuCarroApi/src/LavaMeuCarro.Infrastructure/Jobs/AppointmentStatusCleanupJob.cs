using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.Infrastructure.Jobs;

/// <summary>
/// Marca agendamentos passados como "no-show" automaticamente
/// Executa diariamente à meia-noite
/// </summary>
public class AppointmentStatusCleanupJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppointmentStatusCleanupJob> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromDays(1); // Executa uma vez por dia

    public AppointmentStatusCleanupJob(
        IServiceScopeFactory scopeFactory,
        ILogger<AppointmentStatusCleanupJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[AppointmentStatusCleanupJob] Starting appointment status cleanup service");

        // Espera até meia-noite
        await WaitForMidnight(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var agendamentoRepo = scope.ServiceProvider.GetRequiredService<IAgendamentoRepository>();

                // Marca agendamentos passados (mais de 1 hora) como no-show
                var affectedRows = await agendamentoRepo.MarkPastAsNoShowAsync(hoursAgo: 1);

                _logger.LogInformation("[AppointmentStatusCleanupJob] Marked {Count} appointments as no-show", affectedRows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AppointmentStatusCleanupJob] Error in cleanup job");
            }

            // Aguarda 24 horas para próxima execução
            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("[AppointmentStatusCleanupJob] Stopping appointment status cleanup service");
    }

    private async Task WaitForMidnight(CancellationToken token)
    {
        var now = DateTime.UtcNow;
        var midnight = now.Date.AddDays(1); // Próxima meia-noite
        var delay = midnight - now;

        if (delay > TimeSpan.Zero)
        {
            _logger.LogInformation("[AppointmentStatusCleanupJob] Waiting {Hours} hours until midnight", delay.TotalHours);
            await Task.Delay(delay, token);
        }
    }
}

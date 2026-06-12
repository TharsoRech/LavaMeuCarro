using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Infrastructure.Services;

namespace LavaMeuCarro.Infrastructure.Jobs;

/// <summary>
/// Envia lembretes de agendamento 30 minutos antes
/// </summary>
public class AppointmentReminderJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppointmentReminderJob> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5); // Verifica a cada 5 minutos

    public AppointmentReminderJob(
        IServiceScopeFactory scopeFactory,
        ILogger<AppointmentReminderJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[AppointmentReminderJob] Starting appointment reminder service");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var agendamentoRepo = scope.ServiceProvider.GetRequiredService<IAgendamentoRepository>();
                var notificacaoRepo = scope.ServiceProvider.GetRequiredService<INotificacaoRepository>();

                // Busca agendamentos nos próximos 30 minutos
                var upcomingAppointments = await agendamentoRepo.GetUpcomingAsync(30);

                foreach (var apt in upcomingAppointments)
                {
                    try
                    {
                        // Cria notificação no banco para o cliente
                        var clientId = apt.ClientId as int?;
                        if (clientId.HasValue)
                        {
                            await notificacaoRepo.CreateAsync(new Domain.Entities.Notificacao
                            {
                                UserId = clientId.Value,
                                Title = "Lembrete de Agendamento",
                                Body = "Seu agendamento é em 30 minutos!",
                                Type = Domain.Enums.NotificationType.AppointmentReminder,
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            });

                            var aptId = apt.Id as int?;
                            _logger.LogInformation("[AppointmentReminderJob] Reminder created for appointment {AppointmentId}", aptId);
                        }
                    }
                    catch (Exception ex)
                    {
                        var aptId = apt.Id as int?;
                        _logger.LogError(ex, "[AppointmentReminderJob] Error creating reminder for appointment {AppointmentId}", aptId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AppointmentReminderJob] Error in reminder job");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("[AppointmentReminderJob] Stopping appointment reminder service");
    }
}

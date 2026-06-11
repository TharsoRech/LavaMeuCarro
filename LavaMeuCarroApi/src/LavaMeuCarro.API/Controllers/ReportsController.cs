using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IAgendamentoRepository _agendamentoRepo;
    private readonly IUnidadeRepository _unidadeRepo;

    public ReportsController(IAgendamentoRepository agendamentoRepo, IUnidadeRepository unidadeRepo)
    {
        _agendamentoRepo = agendamentoRepo;
        _unidadeRepo = unidadeRepo;
    }

    [HttpGet("business")]
    public async Task<ActionResult> GetBusinessReports(
        [FromQuery] string period = "30d",
        [FromQuery] int? unidadeId = null,
        [FromQuery] string? from = null,
        [FromQuery] string? to = null)
    {
        var now = DateTime.UtcNow;
        DateTime fromDate;
        DateTime toDate = now;

        if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var parsedFrom))
        {
            fromDate = parsedFrom.ToUniversalTime();
            if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var parsedTo))
            {
                toDate = parsedTo.ToUniversalTime();
            }
        }
        else
        {
            switch (period)
            {
                case "7d": fromDate = now.AddDays(-7); break;
                case "30d": fromDate = now.AddDays(-30); break;
                case "90d": fromDate = now.AddDays(-90); break;
                case "12m": fromDate = now.AddMonths(-12); break;
                default: fromDate = now.AddDays(-30); break;
            }
        }

        int[] unitIds;
        if (unidadeId.HasValue)
        {
            unitIds = new[] { unidadeId.Value };
        }
        else
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var units = await _unidadeRepo.GetByOwnerAsync(userId);
            unitIds = units.Select(u => u.Id).ToArray();
        }

        if (unitIds.Length == 0)
        {
            return Ok(new
            {
                period,
                appointmentsOverTime = Array.Empty<object>(),
                revenueOverTime = Array.Empty<object>(),
                servicesRanking = Array.Empty<object>(),
                professionalsRanking = Array.Empty<object>(),
                clientsRanking = Array.Empty<object>(),
                statusBreakdown = Array.Empty<object>(),
                weekdayDemand = Array.Empty<object>(),
                hourlyDemand = Array.Empty<object>(),
                insights = Array.Empty<object>(),
                totalAppointments = 0,
                totalRevenue = 0.0,
                averageTicket = 0.0,
                cancellationRate = 0.0,
                uniqueClients = 0,
                completedAppointments = 0,
                noShowCount = 0,
                professionalsCount = 0,
                servicesCount = 0
            });
        }

        // Aggregate data
        var totalAppointments = 0;
        var totalRevenue = 0m;
        var totalCancelled = 0;
        var statusCounts = new Dictionary<string, int>();

        foreach (var uid in unitIds)
        {
            foreach (AgendamentoStatus status in Enum.GetValues<AgendamentoStatus>())
            {
                var count = await _agendamentoRepo.CountByStatusAsync(uid, status, fromDate, toDate);
                var statusName = status.ToString();
                statusCounts[statusName] = statusCounts.GetValueOrDefault(statusName) + count;
                totalAppointments += count;
                if (status == AgendamentoStatus.Cancelado) totalCancelled += count;
            }
            var revenue = await _agendamentoRepo.SumByUnidadeAsync(uid, fromDate, toDate);
            totalRevenue += revenue;
        }

        var averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
        var cancellationRate = totalAppointments > 0 ? (double)totalCancelled / totalAppointments * 100 : 0;

        // Status breakdown
        var statusBreakdown = statusCounts.Select(kv => new { status = kv.Key, count = kv.Value }).ToList();

        // Time series
        var dailyCounts = await _agendamentoRepo.GetDailyCountsAsync(unitIds, fromDate, toDate);
        var appointmentsOverTime = dailyCounts.Select(d => new { date = ((DateTime)d.Date).ToString("yyyy-MM-dd"), value = (double)(int)d.Count }).ToList();

        var revenueByDate = await _agendamentoRepo.GetRevenueByDateAsync(unitIds, fromDate, toDate);
        var revenueOverTime = revenueByDate.Select(d => new { date = ((DateTime)d.Date).ToString("yyyy-MM-dd"), value = (double)(decimal)d.Revenue }).ToList();

        // Rankings
        var serviceRanking = await _agendamentoRepo.GetServiceRankingAsync(unitIds, fromDate, toDate);
        var servicesRanking = serviceRanking.Select(s => new { name = (string)s.Name, count = (int)s.Count, revenue = (double)(decimal)s.Revenue, averageTicket = (double)(decimal)s.AverageTicket, share = (double)s.Share }).ToList();

        var professionalRanking = await _agendamentoRepo.GetProfessionalRankingAsync(unitIds, fromDate, toDate);
        var professionalsRanking = professionalRanking.Select(p => new { name = (string)p.Name, count = (int)p.Count, revenue = (double)(decimal)p.Revenue, averageTicket = 0.0, share = 0.0 }).ToList();

        var clientRanking = await _agendamentoRepo.GetClientRankingAsync(unitIds, fromDate, toDate);
        var clientsRanking = clientRanking.Select(c => new { name = (string)c.Name, visits = (int)c.Visits, revenue = (double)(decimal)c.Revenue, lastVisit = ((DateTime)c.LastVisit).ToString("yyyy-MM-dd") }).ToList();

        // Demand patterns
        var weekdayDemand = await _agendamentoRepo.GetWeekdayDemandAsync(unitIds, fromDate, toDate);
        var weekdayDemandResult = weekdayDemand.Select(d => new { day = (string)d.Day, count = (int)d.Count }).ToList();

        var hourlyDemand = await _agendamentoRepo.GetHourlyDemandAsync(unitIds, fromDate, toDate);
        var hourlyDemandResult = hourlyDemand.Select(h => new { hour = $"{(int)h.Hour:D2}:00", count = (int)h.Count }).ToList();

        // Extra stats
        var uniqueClients = await _agendamentoRepo.CountUniqueClientsAsync(unitIds, fromDate, toDate);
        var completedAppointments = statusCounts.GetValueOrDefault("Finalizado", 0);
        var noShowCount = await _agendamentoRepo.CountNoShowAsync(unitIds, fromDate, toDate);
        var professionalsCount = await _agendamentoRepo.CountProfessionalsAsync(unitIds);
        var servicesCount = await _agendamentoRepo.CountServicesAsync(unitIds);

        // Additional metrics for enhanced summary cards
        var scheduledRevenue = await _agendamentoRepo.SumScheduledRevenueAsync(unitIds, fromDate, toDate);
        var newClients = await _agendamentoRepo.CountNewClientsAsync(unitIds, fromDate, toDate);
        var lostRevenue = await _agendamentoRepo.SumLostRevenueAsync(unitIds, fromDate, toDate);
        var completionRate = totalAppointments > 0 ? (double)completedAppointments / totalAppointments * 100 : 0;
        var noShowRate = totalAppointments > 0 ? (double)noShowCount / totalAppointments * 100 : 0;

        // Auto insights
        var insights = new List<string>();
        if (cancellationRate > 20)
            insights.Add($"Taxa de cancelamento alta: {cancellationRate:F1}%. Considere enviar lembretes automáticos.");
        if (noShowCount > 0)
            insights.Add($"{noShowCount} cliente(s) não compareceram no período.");
        if (weekdayDemandResult.Count > 0)
        {
            var peakDay = weekdayDemandResult.OrderByDescending(d => d.count).FirstOrDefault();
            if (peakDay != null) insights.Add($"Dia de maior demanda: {peakDay.day} ({peakDay.count} agendamentos).");
        }
        if (hourlyDemandResult.Count > 0)
        {
            var peakHour = hourlyDemandResult.OrderByDescending(h => h.count).FirstOrDefault();
            if (peakHour != null) insights.Add($"Horário de pico: {peakHour.hour} ({peakHour.count} agendamentos).");
        }
        if (totalAppointments > 0 && uniqueClients > 0)
        {
            var avgVisits = (double)totalAppointments / uniqueClients;
            if (avgVisits > 1.5) insights.Add($"Clientes recorrentes: média de {avgVisits:F1} visitas por cliente.");
        }

        return Ok(new
        {
            period,
            appointmentsOverTime,
            revenueOverTime,
            servicesRanking,
            professionalsRanking,
            clientsRanking,
            statusBreakdown,
            weekdayDemand = weekdayDemandResult,
            hourlyDemand = hourlyDemandResult,
            insights,
            totalAppointments,
            totalRevenue = (double)totalRevenue,
            scheduledRevenue = (double)scheduledRevenue,
            averageTicket = (double)averageTicket,
            lostRevenue = (double)lostRevenue,
            cancellationRate,
            uniqueClients,
            newClients,
            completedAppointments,
            completionRate,
            noShowCount,
            noShowRate,
            professionalsCount,
            servicesCount
        });
    }
}

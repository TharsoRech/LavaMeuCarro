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
    public async Task<ActionResult> GetBusinessReports([FromQuery] string period = "30d", [FromQuery] int? unidadeId = null)
    {
        // Determine date range from period
        var now = DateTime.UtcNow;
        DateTime from;
        switch (period)
        {
            case "7d": from = now.AddDays(-7); break;
            case "30d": from = now.AddDays(-30); break;
            case "90d": from = now.AddDays(-90); break;
            case "12m": from = now.AddMonths(-12); break;
            default: from = now.AddDays(-30); break;
        }

        // If no unidadeId, get user's units
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
                statusBreakdown = Array.Empty<object>(),
                totalAppointments = 0,
                totalRevenue = 0.0,
                averageTicket = 0.0,
                cancellationRate = 0.0
            });
        }

        // Aggregate data across units
        var totalAppointments = 0;
        var totalRevenue = 0m;
        var totalCancelled = 0;
        var statusCounts = new Dictionary<string, int>();

        foreach (var uid in unitIds)
        {
            // Count by status
            foreach (AgendamentoStatus status in Enum.GetValues<AgendamentoStatus>())
            {
                var count = await _agendamentoRepo.CountByStatusAsync(uid, status, from, now);
                var statusName = status.ToString();
                statusCounts[statusName] = statusCounts.GetValueOrDefault(statusName) + count;
                totalAppointments += count;
                if (status == AgendamentoStatus.Cancelado) totalCancelled += count;
            }

            // Revenue from finalized appointments
            var revenue = await _agendamentoRepo.SumByUnidadeAsync(uid, from, now);
            totalRevenue += revenue;
        }

        var averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
        var cancellationRate = totalAppointments > 0 ? (double)totalCancelled / totalAppointments * 100 : 0;

        // Build status breakdown
        var statusBreakdown = statusCounts.Select(kv => new { status = kv.Key, count = kv.Value });

        return Ok(new
        {
            period,
            appointmentsOverTime = Array.Empty<object>(), // TODO: implement time series grouping
            revenueOverTime = Array.Empty<object>(), // TODO: implement time series grouping
            servicesRanking = Array.Empty<object>(), // TODO: implement service-level grouping
            statusBreakdown,
            totalAppointments,
            totalRevenue,
            averageTicket,
            cancellationRate
        });
    }
}

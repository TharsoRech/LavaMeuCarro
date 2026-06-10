using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly IUnidadeRepository _unidadeRepo;
    private readonly IAgendamentoRepository _agendamentoRepo;
    private readonly IAssinaturaRepository _assinaturaRepo;
    private readonly IPlanoRepository _planoRepo;
    private readonly IAsaasPaymentRecordRepository _paymentRepo;

    public AdminController(
        IUserRepository userRepo,
        IUnidadeRepository unidadeRepo,
        IAgendamentoRepository agendamentoRepo,
        IAssinaturaRepository assinaturaRepo,
        IPlanoRepository planoRepo,
        IAsaasPaymentRecordRepository paymentRepo)
    {
        _userRepo = userRepo;
        _unidadeRepo = unidadeRepo;
        _agendamentoRepo = agendamentoRepo;
        _assinaturaRepo = assinaturaRepo;
        _planoRepo = planoRepo;
        _paymentRepo = paymentRepo;
    }

    [HttpGet("users")]
    public async Task<ActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] string? search = null)
    {
        var users = await _userRepo.GetAllAsync(page, pageSize, search);
        var total = await _userRepo.CountAsync(search);
        var items = users.Select(u => new
        {
            u.Id, u.Name, u.Email, u.Phone, u.Type, u.Active, u.CreatedAt
        });
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var totalUsers = await _userRepo.CountAsync(null);
        var activeSubscriptions = await _assinaturaRepo.CountActiveAsync();

        // Get total units count (approximate via popular list)
        var allUnits = await _unidadeRepo.GetAllAsync(null, null);
        var totalUnits = allUnits.Count;

        // Get current month revenue from finalized appointments across all units
        var now = DateTime.UtcNow;
        var firstOfMonth = new DateTime(now.Year, now.Month, 1);
        var totalRevenue = 0m;
        foreach (var unit in allUnits.Take(100)) // limit to avoid perf issues
        {
            totalRevenue += await _agendamentoRepo.SumByUnidadeAsync(unit.Id, firstOfMonth, now);
        }

        return Ok(new
        {
            totalUsers,
            totalUnits,
            totalAppointments = 0, // would need a total count method
            totalRevenue,
            activeSubscriptions,
            monthlyRevenue = totalRevenue
        });
    }

    [HttpGet("assinaturas")]
    public async Task<ActionResult> GetAssinaturas([FromQuery] int page = 1, [FromQuery] int pageSize = 25, [FromQuery] SubscriptionStatus? status = null)
    {
        var (items, total) = await _assinaturaRepo.GetPagedAsync(page, pageSize, status);
        var planos = await _planoRepo.GetAllAsync();
        var planoDict = planos.ToDictionary(p => p.Id);

        var result = items.Select(a =>
        {
            planoDict.TryGetValue(a.PlanoId, out var plano);
            return new
            {
                a.Id,
                a.OwnerId,
                a.PlanoId,
                PlanoName = plano?.Name ?? "Unknown",
                a.Status,
                a.StartDate,
                a.EndDate,
                a.TrialEndDate,
                a.AgendamentosNoMes,
                a.CreatedAt,
                a.UpdatedAt
            };
        });

        return Ok(new { items = result, total, page, pageSize });
    }

    [HttpPatch("assinaturas/{id}/cancel")]
    public async Task<ActionResult> CancelAssinatura(int id)
    {
        var assinatura = await _assinaturaRepo.GetByIdAsync(id);
        if (assinatura == null) return NotFound();

        assinatura.Status = SubscriptionStatus.Cancelled;
        assinatura.UpdatedAt = DateTime.UtcNow;
        await _assinaturaRepo.UpdateAsync(assinatura);

        return Ok(new { success = true });
    }

    [HttpGet("assinaturas/monitor")]
    public async Task<ActionResult> MonitorAssinaturas()
    {
        var healthy = await _assinaturaRepo.CountByStatusAsync(SubscriptionStatus.Active);
        var expired = await _assinaturaRepo.CountByStatusAsync(SubscriptionStatus.Expired);
        var suspended = await _assinaturaRepo.CountByStatusAsync(SubscriptionStatus.Suspended);

        var (allAssinaturas, _) = await _assinaturaRepo.GetPagedAsync(1, 100, SubscriptionStatus.Active);
        var expiringSoon = allAssinaturas.Count(a => a.EndDate.HasValue && a.EndDate.Value <= DateTime.UtcNow.AddDays(7));

        return Ok(new
        {
            healthy,
            expiringSoon,
            expired,
            suspended,
            details = Array.Empty<object>()
        });
    }

    [HttpPost("assinaturas/manual-grant")]
    public async Task<ActionResult> ManualGrant([FromBody] ManualGrantRequest request)
    {
        var existing = await _assinaturaRepo.GetByOwnerAsync(request.OwnerId);
        if (existing != null)
        {
            existing.Status = SubscriptionStatus.Active;
            existing.EndDate = (existing.EndDate ?? DateTime.UtcNow).AddDays(request.DurationDays);
            existing.UpdatedAt = DateTime.UtcNow;
            await _assinaturaRepo.UpdateAsync(existing);
            return Ok(new { success = true, subscriptionId = existing.Id, endDate = existing.EndDate });
        }

        var nova = new Assinatura
        {
            OwnerId = request.OwnerId,
            PlanoId = request.PlanoId,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(request.DurationDays),
            AgendamentosNoMes = 0,
            CreatedAt = DateTime.UtcNow
        };
        var id = await _assinaturaRepo.CreateAsync(nova);
        return Ok(new { success = true, subscriptionId = id, endDate = nova.EndDate });
    }

    [HttpGet("payments")]
    public async Task<ActionResult> GetPayments([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var (items, total) = await _paymentRepo.GetPagedAsync(page, pageSize, status);
        return Ok(new { items, total, page, pageSize });
    }
}

public record ManualGrantRequest(int OwnerId, int PlanoId, int DurationDays, string? Notes);

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Application.DTOs;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/notificacoes")]
[Authorize]
public class NotificacoesController : ControllerBase
{
    private readonly INotificacaoRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IAgendamentoRepository _agendamentoRepo;
    private readonly IPushDeviceTokenRepository _deviceTokenRepo;
    
    public NotificacoesController(
        INotificacaoRepository repo, 
        IUserRepository userRepo,
        IAgendamentoRepository agendamentoRepo,
        IPushDeviceTokenRepository deviceTokenRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
        _agendamentoRepo = agendamentoRepo;
        _deviceTokenRepo = deviceTokenRepo;
    }

    private int UserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var notificacoes = await _repo.GetByUserAsync(UserId);
        var unread = await _repo.CountUnreadAsync(UserId);
        return Ok(new { items = notificacoes, unreadCount = unread });
    }

    [HttpPatch("{id}/read")]
    public async Task<ActionResult> MarkAsRead(int id)
    {
        await _repo.MarkReadAsync(id);
        return Ok();
    }

    [HttpPost("mark-all-read")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        await _repo.MarkAllReadAsync(UserId);
        return Ok();
    }

    /// <summary>
    /// Lista clientes de uma unidade para envio de broadcast
    /// </summary>
    [HttpGet("broadcast/clients")]
    public async Task<ActionResult> GetBroadcastClients(
        [FromQuery] int salonId,
        [FromQuery] string? search = null,
        [FromQuery] bool onlyWithPushToken = false)
    {
        // Get all appointments for this salon to find unique clients
        var appointments = await _agendamentoRepo.GetByUnidadeAsync(salonId, null, null);
        
        var clientIds = appointments
            .Select(a => a.ClientId)
            .Distinct()
            .ToList();

        if (clientIds.Count == 0)
        {
            return Ok(new List<SalonClientForBroadcastDto>());
        }

        // Get user details for these clients
        var users = await _userRepo.GetByIdsAsync(clientIds);
        
        // Filter by search if provided
        if (!string.IsNullOrWhiteSpace(search))
        {
            users = users.Where(u => 
                u.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (u.Phone != null && u.Phone.Contains(search)) ||
                (u.Email != null && u.Email.Contains(search, StringComparison.OrdinalIgnoreCase))
            ).ToList();
        }

        // Get push device tokens if needed
        var pushTokens = new Dictionary<int, int>();
        if (onlyWithPushToken)
        {
            var allTokens = await _deviceTokenRepo.GetAllActiveAsync();
            pushTokens = allTokens
                .GroupBy(t => t.UserId)
                .ToDictionary(g => g.Key, g => g.Count());
        }

        var result = users
            .Where(u => !onlyWithPushToken || pushTokens.ContainsKey(u.Id))
            .Select(u => new SalonClientForBroadcastDto
            {
                ClientId = u.Id,
                Name = u.Name,
                Phone = u.Phone,
                Email = u.Email,
                HasPushToken = pushTokens.ContainsKey(u.Id),
                PushTokenCount = pushTokens.GetValueOrDefault(u.Id, 0)
            })
            .OrderBy(u => u.Name)
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// Envia notificação push em massa para clientes selecionados
    /// </summary>
    [HttpPost("broadcast")]
    public async Task<ActionResult> Broadcast([FromBody] ClientBroadcastRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest("Title e message são obrigatórios");

        if (request.ClientIds == null || request.ClientIds.Count == 0)
            return BadRequest("Selecione pelo menos um cliente");

        // Busca usuários clientes
        var users = await _userRepo.GetByIdsAsync(request.ClientIds);
        
        var successCount = 0;
        var failureCount = 0;
        var errors = new List<string>();

        foreach (var user in users)
        {
            try
            {
                // Cria notificação no banco
                await _repo.CreateAsync(new Domain.Entities.Notificacao
                {
                    UserId = user.Id,
                    Title = request.Title,
                    Body = request.Message,
                    Type = Domain.Enums.NotificationType.Promotion,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                successCount++;
            }
            catch (Exception ex)
            {
                failureCount++;
                errors.Add($"Falha para usuário {user.Id}: {ex.Message}");
            }
        }

        return Ok(new
        {
            success = true,
            totalSent = successCount,
            totalFailed = failureCount,
            errors = failureCount > 0 ? errors : null
        });
    }
}

public class ClientBroadcastRequest
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<int>? ClientIds { get; set; }
    public int? SalonId { get; set; }
}

public class SalonClientForBroadcastDto
{
    public int ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool HasPushToken { get; set; }
    public int PushTokenCount { get; set; }
}

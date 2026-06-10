using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/notificacoes")]
[Authorize]
public class NotificacoesController : ControllerBase
{
    private readonly INotificacaoRepository _repo;
    public NotificacoesController(INotificacaoRepository repo) => _repo = repo;

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
}

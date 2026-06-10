using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/privacy")]
[Authorize]
public class PrivacyController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly IAgendamentoRepository _agendamentoRepo;

    public PrivacyController(IUserRepository userRepo, IAgendamentoRepository agendamentoRepo)
    {
        _userRepo = userRepo;
        _agendamentoRepo = agendamentoRepo;
    }

    private int UserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("export")]
    public async Task<ActionResult> ExportData()
    {
        var user = await _userRepo.GetByIdAsync(UserId);
        if (user == null) return NotFound();

        var agendamentos = await _agendamentoRepo.GetByClientAsync(UserId);

        return Ok(new
        {
            userData = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                user.Doc,
                user.Dob,
                user.Username,
                user.Country,
                user.Type,
                user.CreatedAt
            },
            appointments = agendamentos.Select(a => new
            {
                a.Id,
                a.UnidadeId,
                a.ServicoId,
                a.ScheduledAt,
                a.TotalPrice,
                a.Status,
                a.CreatedAt
            }),
            exportedAt = DateTime.UtcNow
        });
    }

    [HttpDelete("account")]
    public async Task<ActionResult> DeleteAccount()
    {
        var user = await _userRepo.GetByIdAsync(UserId);
        if (user == null) return NotFound();

        // Soft delete - deactivate user
        await _userRepo.DeleteAsync(UserId);

        return Ok(new { success = true, message = "Account deactivated successfully" });
    }
}

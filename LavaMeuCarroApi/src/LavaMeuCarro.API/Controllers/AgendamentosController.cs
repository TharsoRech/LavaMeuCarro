using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Commands.Agendamentos;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Queries.Agendamentos;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/appointments")]
public class AgendamentosController : ControllerBase
{
    private readonly IMediator _mediator;
    public AgendamentosController(IMediator mediator) => _mediator = mediator;

    private int UserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<AgendamentoDTO>> Create([FromBody] CreateAgendamentoRequest request)
        => Ok(await _mediator.Send(new CreateAgendamentoCommand(UserId, request)));

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<List<AgendamentoDTO>>> GetMine()
        => Ok(await _mediator.Send(new GetMyAgendamentosQuery(UserId)));

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<AgendamentoDTO>> GetById(int id)
        => Ok(await _mediator.Send(new GetAgendamentoByIdQuery(id, UserId)));

    [HttpGet("unidade/{unidadeId}")]
    [Authorize]
    public async Task<ActionResult<List<AgendamentoDTO>>> GetByUnidade(int unidadeId, [FromQuery] DateTime? date, [FromQuery] int? funcionarioId)
        => Ok(await _mediator.Send(new GetUnidadeAgendamentosQuery(unidadeId, date, funcionarioId)));

    [HttpGet("unidade/{unidadeId}/paged")]
    [Authorize]
    public async Task<ActionResult<PagedResult<AgendamentoDTO>>> GetPaged(int unidadeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] AgendamentoStatus? status = null)
        => Ok(await _mediator.Send(new GetPagedAgendamentosQuery(unidadeId, page, pageSize, search, status)));

    [HttpGet("unidade/{unidadeId}/dashboard-summary")]
    [Authorize]
    public async Task<ActionResult<DashboardSummaryDTO>> GetDashboardSummary(int unidadeId)
        => Ok(await _mediator.Send(new GetDashboardSummaryQuery(unidadeId)));

    [HttpPatch("{id}/status")]
    [Authorize]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        await _mediator.Send(new UpdateAgendamentoStatusCommand(id, UserId, request));
        return Ok();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Cancel(int id, [FromQuery] string? reason)
    {
        await _mediator.Send(new CancelAgendamentoCommand(id, UserId, reason));
        return Ok();
    }

    [HttpGet("{id}/client-history")]
    [Authorize]
    public async Task<ActionResult<ClientAppointmentHistoryDTO>> GetClientHistory(int id)
    {
        var appt = await _mediator.Send(new GetAgendamentoByIdQuery(id, UserId));
        return Ok(await _mediator.Send(new GetClientAppointmentHistoryQuery(appt.ClientId, appt.UnidadeId, UserId)));
    }

    [HttpGet("{id}/eligible-professionals")]
    [Authorize]
    public async Task<ActionResult<List<ProfessionalOptionDTO>>> GetEligibleProfessionals(int id)
        => Ok(await _mediator.Send(new GetEligibleProfessionalsQuery(id, UserId)));

    [HttpPatch("{id}/reassign")]
    [Authorize]
    public async Task<ActionResult> ReassignProfessional(int id, [FromBody] ReassignProfessionalRequest request)
    {
        await _mediator.Send(new ReatribuirFuncionarioCommand(id, UserId, request.NovoFuncionarioId));
        return Ok();
    }

    [HttpPost("{id}/vistoria")]
    [Authorize]
    public async Task<ActionResult> Vistoria(int id, [FromBody] VistoriaRequest request)
    {
        await _mediator.Send(new VistoriaCommand(id, UserId, request));
        return Ok();
    }

    [HttpPost("{id}/retirada")]
    [Authorize]
    public async Task<ActionResult> Retirada(int id, [FromBody] RetiradaRequest request)
    {
        await _mediator.Send(new RetiradaCommand(id, UserId, request));
        return Ok();
    }
}

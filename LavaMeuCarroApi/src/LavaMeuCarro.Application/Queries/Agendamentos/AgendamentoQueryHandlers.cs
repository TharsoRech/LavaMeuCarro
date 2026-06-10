using MediatR;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;
using LavaMeuCarro.Domain.Exceptions;

namespace LavaMeuCarro.Application.Queries.Agendamentos;

public class GetMyAgendamentosHandler : IRequestHandler<GetMyAgendamentosQuery, List<AgendamentoDTO>>
{
    private readonly IAgendamentoRepository _repo;
    public GetMyAgendamentosHandler(IAgendamentoRepository repo) => _repo = repo;
    public async Task<List<AgendamentoDTO>> Handle(GetMyAgendamentosQuery cmd, CancellationToken ct)
        => (await _repo.GetByClientAsync(cmd.ClientId)).Select(Map).ToList();
    private static AgendamentoDTO Map(Agendamento a) => new(a.Id, a.ClientId, a.FuncionarioId, a.ServicoId, a.UnidadeId, a.VeiculoId, a.ScheduledAt, a.DurationMinutes, a.TotalPrice, a.Status, a.Modalidade, a.TaxaDeslocamento, a.PrecoBruto, a.Desconto, a.PrecoAdicionais, a.Notes, a.CancellationReason, a.CreatedAt, a.VistoriaFotos, a.VistoriaObservacoes, a.VistoriaData, a.RetiradoPor, a.NomeAutorizado, a.DocumentoAutorizado, a.RetiradaEm, null, null, null, null, null, null, null);
}

public class GetPagedAgendamentosHandler : IRequestHandler<GetPagedAgendamentosQuery, PagedResult<AgendamentoDTO>>
{
    private readonly IAgendamentoRepository _repo;
    public GetPagedAgendamentosHandler(IAgendamentoRepository repo) => _repo = repo;
    public async Task<PagedResult<AgendamentoDTO>> Handle(GetPagedAgendamentosQuery cmd, CancellationToken ct)
    {
        var (items, total) = await _repo.GetPagedAsync(cmd.UnidadeId, cmd.Page, cmd.PageSize, cmd.Search, cmd.Status);
        var dtos = items.Select(a => new AgendamentoDTO(a.Id, a.ClientId, a.FuncionarioId, a.ServicoId, a.UnidadeId, a.VeiculoId, a.ScheduledAt, a.DurationMinutes, a.TotalPrice, a.Status, a.Modalidade, a.TaxaDeslocamento, a.PrecoBruto, a.Desconto, a.PrecoAdicionais, a.Notes, a.CancellationReason, a.CreatedAt, a.VistoriaFotos, a.VistoriaObservacoes, a.VistoriaData, a.RetiradoPor, a.NomeAutorizado, a.DocumentoAutorizado, a.RetiradaEm, null, null, null, null, null, null, null)).ToList();
        return new PagedResult<AgendamentoDTO>(dtos, total, cmd.Page, cmd.PageSize);
    }
}

public class GetDashboardSummaryHandler : IRequestHandler<GetDashboardSummaryQuery, DashboardSummaryDTO>
{
    private readonly IAgendamentoRepository _repo;
    public GetDashboardSummaryHandler(IAgendamentoRepository repo) => _repo = repo;
    public async Task<DashboardSummaryDTO> Handle(GetDashboardSummaryQuery cmd, CancellationToken ct)
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var confirmados = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Confirmado, today, today.AddDays(1));
        var pendentes = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Pendente, null, null);
        var finalizados = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Finalizado, monthStart, today.AddDays(1));
        var faturamento = await _repo.SumByUnidadeAsync(cmd.UnidadeId, monthStart, today.AddDays(1));
        return new DashboardSummaryDTO(0, confirmados, pendentes, finalizados, faturamento);
    }
}

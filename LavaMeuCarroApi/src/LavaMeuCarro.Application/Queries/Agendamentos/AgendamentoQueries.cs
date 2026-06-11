using MediatR;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Application.Queries.Agendamentos;

public record GetMyAgendamentosQuery(int ClientId) : IRequest<List<AgendamentoDTO>>;
public record GetAgendamentoByIdQuery(int Id, int UserId) : IRequest<AgendamentoDTO>;
public record GetUnidadeAgendamentosQuery(int UnidadeId, DateTime? Date, int? FuncionarioId) : IRequest<List<AgendamentoDTO>>;
public record GetPagedAgendamentosQuery(int UnidadeId, int Page, int PageSize, string? Search, AgendamentoStatus? Status) : IRequest<PagedResult<AgendamentoDTO>>;
public record GetDashboardSummaryQuery(int UnidadeId) : IRequest<DashboardSummaryDTO>;
public record GetAgendamentosByStatusQuery(AgendamentoStatus Status, int UserId) : IRequest<List<AgendamentoDTO>>;
public record GetClientAppointmentHistoryQuery(int ClientId, int UnidadeId, int UserId) : IRequest<ClientAppointmentHistoryDTO>;
public record GetEligibleProfessionalsQuery(int AgendamentoId, int UserId) : IRequest<List<ProfessionalOptionDTO>>;

using MediatR;
using LavaMeuCarro.Application.DTOs;

namespace LavaMeuCarro.Application.Commands.Agendamentos;

public record CreateAgendamentoCommand(int UserId, CreateAgendamentoRequest Request) : IRequest<AgendamentoDTO>;
public record CreateManualAgendamentoCommand(int UserId, CreateManualAgendamentoRequest Request) : IRequest<AgendamentoDTO>;
public record UpdateAgendamentoStatusCommand(int Id, int UserId, UpdateStatusRequest Request) : IRequest<Unit>;
public record CancelAgendamentoCommand(int Id, int UserId, string? Reason) : IRequest<Unit>;
public record VistoriaCommand(int Id, int UserId, VistoriaRequest Request) : IRequest<Unit>;
public record RetiradaCommand(int Id, int UserId, RetiradaRequest Request) : IRequest<Unit>;
public record ReatribuirFuncionarioCommand(int Id, int UserId, int NovoFuncionarioId) : IRequest<Unit>;

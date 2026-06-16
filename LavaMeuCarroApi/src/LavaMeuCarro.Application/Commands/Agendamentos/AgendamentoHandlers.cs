using MediatR;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;
using LavaMeuCarro.Domain.Exceptions;

namespace LavaMeuCarro.Application.Commands.Agendamentos;

public class CreateAgendamentoHandler : IRequestHandler<CreateAgendamentoCommand, AgendamentoDTO>
{
    private readonly IAgendamentoRepository _repo;
    private readonly IServicoRepository _servicoRepo;
    private readonly IVeiculoRepository _veiculoRepo;
    private readonly IAssinaturaRepository _assinaturaRepo;
    private readonly IPlanoRepository _planoRepo;

    public CreateAgendamentoHandler(IAgendamentoRepository repo, IServicoRepository servicoRepo, IVeiculoRepository veiculoRepo, IAssinaturaRepository assinaturaRepo, IPlanoRepository planoRepo)
    {
        _repo = repo; _servicoRepo = servicoRepo; _veiculoRepo = veiculoRepo;
        _assinaturaRepo = assinaturaRepo; _planoRepo = planoRepo;
    }

    public async Task<AgendamentoDTO> Handle(CreateAgendamentoCommand cmd, CancellationToken ct)
    {
        var servico = await _servicoRepo.GetByIdAsync(cmd.Request.ServicoId)
            ?? throw new NotFoundException("Service not found");

        var veiculo = await _veiculoRepo.GetByIdAsync(cmd.Request.VeiculoId)
            ?? throw new NotFoundException("Vehicle not found");

        if (veiculo.ClientId != cmd.UserId)
            throw new ForbiddenException("Vehicle does not belong to user");

        var fim = cmd.Request.ScheduledAt.AddMinutes(servico.DurationMinutes);
        if (await _repo.HasConflictAsync(cmd.Request.UnidadeId, cmd.Request.ScheduledAt, fim, null))
            throw new ConflictException("Time slot conflict");

        var agendamento = new Agendamento
        {
            ClientId = cmd.UserId, FuncionarioId = cmd.Request.FuncionarioId,
            ServicoId = cmd.Request.ServicoId, UnidadeId = cmd.Request.UnidadeId,
            VeiculoId = cmd.Request.VeiculoId, ScheduledAt = cmd.Request.ScheduledAt,
            DurationMinutes = servico.DurationMinutes, TotalPrice = servico.Price,
            PrecoBruto = servico.Price, Modalidade = cmd.Request.Modalidade,
            Notes = cmd.Request.Notes, Status = AgendamentoStatus.Pending
        };

        agendamento.Id = await _repo.CreateAsync(agendamento);
        return await GetDTO(agendamento);
    }

    private async Task<AgendamentoDTO> GetDTO(Agendamento a)
    {
        var servico = await _servicoRepo.GetByIdAsync(a.ServicoId);
        var veiculo = await _veiculoRepo.GetByIdAsync(a.VeiculoId);
        return new AgendamentoDTO(a.Id, a.ClientId, a.FuncionarioId, a.ServicoId, a.UnidadeId,
            a.VeiculoId, a.ScheduledAt, a.DurationMinutes, a.TotalPrice, a.Status, a.Modalidade,
            a.TaxaDeslocamento, a.PrecoBruto, a.Desconto, a.PrecoAdicionais, a.Notes,
            a.CancellationReason, a.CreatedAt, a.VistoriaFotos, a.VistoriaObservacoes,
            a.VistoriaData, a.RetiradoPor, a.NomeAutorizado, a.DocumentoAutorizado,
            a.RetiradaEm,
            null, null, null, null,  // ClientName, ClientPhone, ClientCity, ClientImage
            null, null,              // FuncionarioName, FuncionarioImage
            servico?.Name,           // ServicoName
            null, null, null, null,  // UnidadeName, UnidadeLogoUrl, UnidadeWhatsApp, UnidadeAddress
            veiculo?.Placa, veiculo?.Modelo);
    }
}

public class UpdateAgendamentoStatusHandler : IRequestHandler<UpdateAgendamentoStatusCommand, Unit>
{
    private readonly IAgendamentoRepository _repo;
    public UpdateAgendamentoStatusHandler(IAgendamentoRepository repo) => _repo = repo;

    public async Task<Unit> Handle(UpdateAgendamentoStatusCommand cmd, CancellationToken ct)
    {
        var ag = await _repo.GetByIdAsync(cmd.Id)
            ?? throw new NotFoundException("Appointment not found");

        ag.Status = cmd.Request.Status;
        ag.UpdatedAt = DateTime.UtcNow;

        if (cmd.Request.Status == AgendamentoStatus.Cancelled)
            ag.CancellationReason = cmd.Request.CancellationReason;

        await _repo.UpdateAsync(ag);
        return Unit.Value;
    }
}

public class CancelAgendamentoHandler : IRequestHandler<CancelAgendamentoCommand, Unit>
{
    private readonly IAgendamentoRepository _repo;
    public CancelAgendamentoHandler(IAgendamentoRepository repo) => _repo = repo;

    public async Task<Unit> Handle(CancelAgendamentoCommand cmd, CancellationToken ct)
    {
        var ag = await _repo.GetByIdAsync(cmd.Id)
            ?? throw new NotFoundException("Appointment not found");

        if (ag.Status == AgendamentoStatus.Completed)
            throw new BusinessException("Cannot cancel completed appointment");

        ag.Status = AgendamentoStatus.Cancelled;
        ag.CancellationReason = cmd.Reason;
        ag.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(ag);
        return Unit.Value;
    }
}

public class VistoriaHandler : IRequestHandler<VistoriaCommand, Unit>
{
    private readonly IAgendamentoRepository _repo;
    public VistoriaHandler(IAgendamentoRepository repo) => _repo = repo;

    public async Task<Unit> Handle(VistoriaCommand cmd, CancellationToken ct)
    {
        var ag = await _repo.GetByIdAsync(cmd.Id)
            ?? throw new NotFoundException("Appointment not found");

        ag.VistoriaFotos = System.Text.Json.JsonSerializer.Serialize(cmd.Request.Fotos);
        ag.VistoriaObservacoes = cmd.Request.Observacoes;
        ag.VistoriaData = DateTime.UtcNow;
        ag.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(ag);
        return Unit.Value;
    }
}

public class RetiradaHandler : IRequestHandler<RetiradaCommand, Unit>
{
    private readonly IAgendamentoRepository _repo;
    public RetiradaHandler(IAgendamentoRepository repo) => _repo = repo;

    public async Task<Unit> Handle(RetiradaCommand cmd, CancellationToken ct)
    {
        var ag = await _repo.GetByIdAsync(cmd.Id)
            ?? throw new NotFoundException("Appointment not found");

        ag.RetiradoPor = cmd.Request.RetiradoPor;
        ag.NomeAutorizado = cmd.Request.NomeAutorizado;
        ag.DocumentoAutorizado = cmd.Request.DocumentoAutorizado;
        ag.RetiradaEm = DateTime.UtcNow;
        ag.Status = AgendamentoStatus.Completed;
        ag.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(ag);
        return Unit.Value;
    }
}

public class ReatribuirFuncionarioHandler : IRequestHandler<ReatribuirFuncionarioCommand, Unit>
{
    private readonly IAgendamentoRepository _repo;
    private readonly IFuncionarioRepository _funcRepo;
    public ReatribuirFuncionarioHandler(IAgendamentoRepository repo, IFuncionarioRepository funcRepo)
    {
        _repo = repo;
        _funcRepo = funcRepo;
    }

    public async Task<Unit> Handle(ReatribuirFuncionarioCommand cmd, CancellationToken ct)
    {
        var ag = await _repo.GetByIdAsync(cmd.Id)
            ?? throw new NotFoundException("Appointment not found");

        if (ag.Status == AgendamentoStatus.Completed || ag.Status == AgendamentoStatus.Cancelled)
            throw new BusinessException("Cannot reassign completed or cancelled appointment");

        var novoFunc = await _funcRepo.GetByIdAsync(cmd.NovoFuncionarioId)
            ?? throw new NotFoundException("Professional not found");

        if (novoFunc.UnidadeId != ag.UnidadeId)
            throw new BusinessException("Professional does not belong to the same unit");

        ag.FuncionarioId = cmd.NovoFuncionarioId;
        // Reset to pending so the unit can re-confirm
        if (ag.Status == AgendamentoStatus.Confirmed)
            ag.Status = AgendamentoStatus.Pending;
        ag.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(ag);
        return Unit.Value;
    }
}

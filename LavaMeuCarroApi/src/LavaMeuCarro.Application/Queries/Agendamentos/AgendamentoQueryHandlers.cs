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
    private readonly IUserRepository _userRepo;
    private readonly IServicoRepository _servicoRepo;
    private readonly IFuncionarioRepository _funcionarioRepo;
    private readonly IUnidadeRepository _unidadeRepo;
    private readonly IVeiculoRepository _veiculoRepo;

    public GetMyAgendamentosHandler(IAgendamentoRepository repo, IUserRepository userRepo,
        IServicoRepository servicoRepo, IFuncionarioRepository funcionarioRepo,
        IUnidadeRepository unidadeRepo, IVeiculoRepository veiculoRepo)
    {
        _repo = repo; _userRepo = userRepo; _servicoRepo = servicoRepo;
        _funcionarioRepo = funcionarioRepo; _unidadeRepo = unidadeRepo; _veiculoRepo = veiculoRepo;
    }

    public async Task<List<AgendamentoDTO>> Handle(GetMyAgendamentosQuery cmd, CancellationToken ct)
    {
        var appointments = await _repo.GetByClientAsync(cmd.ClientId);
        return await MapWithJoins(appointments);
    }

    private async Task<List<AgendamentoDTO>> MapWithJoins(List<Agendamento> appointments)
    {
        if (appointments.Count == 0) return new List<AgendamentoDTO>();

        var userIds = appointments.Select(a => a.ClientId).Distinct().ToList();
        var servicoIds = appointments.Select(a => a.ServicoId).Distinct().ToList();
        var funcionarioIds = appointments.Select(a => a.FuncionarioId).Distinct().ToList();
        var unidadeIds = appointments.Select(a => a.UnidadeId).Distinct().ToList();
        var veiculoIds = appointments.Select(a => a.VeiculoId).Distinct().ToList();

        var users = (await _userRepo.GetByIdsAsync(userIds)).ToDictionary(u => u.Id);
        var servicos = (await _servicoRepo.GetByIdsAsync(servicoIds)).ToDictionary(s => s.Id);
        var funcionarios = (await _funcionarioRepo.GetByIdsAsync(funcionarioIds)).ToDictionary(f => f.Id);
        var unidades = (await _unidadeRepo.GetByIdsAsync(unidadeIds)).ToDictionary(u => u.Id);
        var veiculos = (await _veiculoRepo.GetByIdsAsync(veiculoIds)).ToDictionary(v => v.Id);

        // Get funcionario user names
        var funcUserIds = funcionarios.Values.Select(f => f.UserId).Distinct().ToList();
        var funcUsers = (await _userRepo.GetByIdsAsync(funcUserIds)).ToDictionary(u => u.Id);

        return appointments.Select(a => MapDTO(a, users, servicos, funcionarios, unidades, veiculos, funcUsers)).ToList();
    }

    internal static AgendamentoDTO MapDTO(Agendamento a,
        Dictionary<int, User> users, Dictionary<int, Servico> servicos,
        Dictionary<int, Funcionario> funcionarios, Dictionary<int, Unidade> unidades,
        Dictionary<int, Veiculo> veiculos, Dictionary<int, User> funcUsers)
    {
        users.TryGetValue(a.ClientId, out var client);
        servicos.TryGetValue(a.ServicoId, out var servico);
        funcionarios.TryGetValue(a.FuncionarioId, out var func);
        unidades.TryGetValue(a.UnidadeId, out var unidade);
        veiculos.TryGetValue(a.VeiculoId, out var veiculo);

        string? funcName = null;
        if (func != null && funcUsers.TryGetValue(func.UserId, out var funcUser))
            funcName = funcUser.Name;

        return new AgendamentoDTO(a.Id, a.ClientId, a.FuncionarioId, a.ServicoId, a.UnidadeId,
            a.VeiculoId, a.ScheduledAt, a.DurationMinutes, a.TotalPrice, a.Status, a.Modalidade,
            a.TaxaDeslocamento, a.PrecoBruto, a.Desconto, a.PrecoAdicionais, a.Notes,
            a.CancellationReason, a.CreatedAt, a.VistoriaFotos, a.VistoriaObservacoes,
            a.VistoriaData, a.RetiradoPor, a.NomeAutorizado, a.DocumentoAutorizado,
            a.RetiradaEm,
            client?.Name, client?.Phone, funcName, servico?.Name, unidade?.Name,
            veiculo?.Placa, veiculo?.Modelo);
    }
}

public class GetAgendamentoByIdHandler : IRequestHandler<GetAgendamentoByIdQuery, AgendamentoDTO>
{
    private readonly IAgendamentoRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IServicoRepository _servicoRepo;
    private readonly IFuncionarioRepository _funcionarioRepo;
    private readonly IUnidadeRepository _unidadeRepo;
    private readonly IVeiculoRepository _veiculoRepo;

    public GetAgendamentoByIdHandler(IAgendamentoRepository repo, IUserRepository userRepo,
        IServicoRepository servicoRepo, IFuncionarioRepository funcionarioRepo,
        IUnidadeRepository unidadeRepo, IVeiculoRepository veiculoRepo)
    {
        _repo = repo; _userRepo = userRepo; _servicoRepo = servicoRepo;
        _funcionarioRepo = funcionarioRepo; _unidadeRepo = unidadeRepo; _veiculoRepo = veiculoRepo;
    }

    public async Task<AgendamentoDTO> Handle(GetAgendamentoByIdQuery cmd, CancellationToken ct)
    {
        var a = await _repo.GetByIdAsync(cmd.Id)
            ?? throw new NotFoundException("Appointment not found");

        var users = (await _userRepo.GetByIdsAsync(new List<int> { a.ClientId })).ToDictionary(u => u.Id);
        var servicos = (await _servicoRepo.GetByIdsAsync(new List<int> { a.ServicoId })).ToDictionary(s => s.Id);
        var funcionarios = (await _funcionarioRepo.GetByIdsAsync(new List<int> { a.FuncionarioId })).ToDictionary(f => f.Id);
        var unidades = (await _unidadeRepo.GetByIdsAsync(new List<int> { a.UnidadeId })).ToDictionary(u => u.Id);
        var veiculos = (await _veiculoRepo.GetByIdsAsync(new List<int> { a.VeiculoId })).ToDictionary(v => v.Id);

        var funcUserIds = funcionarios.Values.Select(f => f.UserId).ToList();
        var funcUsers = funcUserIds.Count > 0
            ? (await _userRepo.GetByIdsAsync(funcUserIds)).ToDictionary(u => u.Id)
            : new Dictionary<int, User>();

        return GetMyAgendamentosHandler.MapDTO(a, users, servicos, funcionarios, unidades, veiculos, funcUsers);
    }
}

public class GetUnidadeAgendamentosHandler : IRequestHandler<GetUnidadeAgendamentosQuery, List<AgendamentoDTO>>
{
    private readonly IAgendamentoRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IServicoRepository _servicoRepo;
    private readonly IFuncionarioRepository _funcionarioRepo;
    private readonly IUnidadeRepository _unidadeRepo;
    private readonly IVeiculoRepository _veiculoRepo;

    public GetUnidadeAgendamentosHandler(IAgendamentoRepository repo, IUserRepository userRepo,
        IServicoRepository servicoRepo, IFuncionarioRepository funcionarioRepo,
        IUnidadeRepository unidadeRepo, IVeiculoRepository veiculoRepo)
    {
        _repo = repo; _userRepo = userRepo; _servicoRepo = servicoRepo;
        _funcionarioRepo = funcionarioRepo; _unidadeRepo = unidadeRepo; _veiculoRepo = veiculoRepo;
    }

    public async Task<List<AgendamentoDTO>> Handle(GetUnidadeAgendamentosQuery cmd, CancellationToken ct)
    {
        var appointments = await _repo.GetByUnidadeAsync(cmd.UnidadeId, cmd.Date, cmd.FuncionarioId);
        return await MapWithJoins(appointments);
    }

    private async Task<List<AgendamentoDTO>> MapWithJoins(List<Agendamento> appointments)
    {
        if (appointments.Count == 0) return new List<AgendamentoDTO>();

        var userIds = appointments.Select(a => a.ClientId).Distinct().ToList();
        var servicoIds = appointments.Select(a => a.ServicoId).Distinct().ToList();
        var funcionarioIds = appointments.Select(a => a.FuncionarioId).Distinct().ToList();
        var unidadeIds = appointments.Select(a => a.UnidadeId).Distinct().ToList();
        var veiculoIds = appointments.Select(a => a.VeiculoId).Distinct().ToList();

        var users = (await _userRepo.GetByIdsAsync(userIds)).ToDictionary(u => u.Id);
        var servicos = (await _servicoRepo.GetByIdsAsync(servicoIds)).ToDictionary(s => s.Id);
        var funcionarios = (await _funcionarioRepo.GetByIdsAsync(funcionarioIds)).ToDictionary(f => f.Id);
        var unidades = (await _unidadeRepo.GetByIdsAsync(unidadeIds)).ToDictionary(u => u.Id);
        var veiculos = (await _veiculoRepo.GetByIdsAsync(veiculoIds)).ToDictionary(v => v.Id);

        var funcUserIds = funcionarios.Values.Select(f => f.UserId).Distinct().ToList();
        var funcUsers = funcUserIds.Count > 0
            ? (await _userRepo.GetByIdsAsync(funcUserIds)).ToDictionary(u => u.Id)
            : new Dictionary<int, User>();

        return appointments.Select(a => GetMyAgendamentosHandler.MapDTO(a, users, servicos, funcionarios, unidades, veiculos, funcUsers)).ToList();
    }
}

public class GetPagedAgendamentosHandler : IRequestHandler<GetPagedAgendamentosQuery, PagedResult<AgendamentoDTO>>
{
    private readonly IAgendamentoRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IServicoRepository _servicoRepo;
    private readonly IFuncionarioRepository _funcionarioRepo;
    private readonly IUnidadeRepository _unidadeRepo;
    private readonly IVeiculoRepository _veiculoRepo;

    public GetPagedAgendamentosHandler(IAgendamentoRepository repo, IUserRepository userRepo,
        IServicoRepository servicoRepo, IFuncionarioRepository funcionarioRepo,
        IUnidadeRepository unidadeRepo, IVeiculoRepository veiculoRepo)
    {
        _repo = repo; _userRepo = userRepo; _servicoRepo = servicoRepo;
        _funcionarioRepo = funcionarioRepo; _unidadeRepo = unidadeRepo; _veiculoRepo = veiculoRepo;
    }

    public async Task<PagedResult<AgendamentoDTO>> Handle(GetPagedAgendamentosQuery cmd, CancellationToken ct)
    {
        var (items, total) = await _repo.GetPagedAsync(cmd.UnidadeId, cmd.Page, cmd.PageSize, cmd.Search, cmd.Status);

        var userIds = items.Select(a => a.ClientId).Distinct().ToList();
        var servicoIds = items.Select(a => a.ServicoId).Distinct().ToList();
        var funcionarioIds = items.Select(a => a.FuncionarioId).Distinct().ToList();
        var unidadeIds = items.Select(a => a.UnidadeId).Distinct().ToList();
        var veiculoIds = items.Select(a => a.VeiculoId).Distinct().ToList();

        var users = userIds.Count > 0 ? (await _userRepo.GetByIdsAsync(userIds)).ToDictionary(u => u.Id) : new Dictionary<int, User>();
        var servicos = servicoIds.Count > 0 ? (await _servicoRepo.GetByIdsAsync(servicoIds)).ToDictionary(s => s.Id) : new Dictionary<int, Servico>();
        var funcionarios = funcionarioIds.Count > 0 ? (await _funcionarioRepo.GetByIdsAsync(funcionarioIds)).ToDictionary(f => f.Id) : new Dictionary<int, Funcionario>();
        var unidades = unidadeIds.Count > 0 ? (await _unidadeRepo.GetByIdsAsync(unidadeIds)).ToDictionary(u => u.Id) : new Dictionary<int, Unidade>();
        var veiculos = veiculoIds.Count > 0 ? (await _veiculoRepo.GetByIdsAsync(veiculoIds)).ToDictionary(v => v.Id) : new Dictionary<int, Veiculo>();

        var funcUserIds = funcionarios.Values.Select(f => f.UserId).Distinct().ToList();
        var funcUsers = funcUserIds.Count > 0
            ? (await _userRepo.GetByIdsAsync(funcUserIds)).ToDictionary(u => u.Id)
            : new Dictionary<int, User>();

        var dtos = items.Select(a => GetMyAgendamentosHandler.MapDTO(a, users, servicos, funcionarios, unidades, veiculos, funcUsers)).ToList();
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

        var totalToday = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Confirmado, today, today.AddDays(1))
            + await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Pendente, today, today.AddDays(1))
            + await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.EmExecucao, today, today.AddDays(1))
            + await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Pronto, today, today.AddDays(1));

        var confirmados = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Confirmado, today, today.AddDays(1));
        var pendentes = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Pendente, null, null);
        var finalizadosMes = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Finalizado, monthStart, today.AddDays(1));
        var finalizadosHoje = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Finalizado, today, today.AddDays(1));
        var faturamentoMes = await _repo.SumByUnidadeAsync(cmd.UnidadeId, monthStart, today.AddDays(1));
        var faturamentoHoje = await _repo.SumByUnidadeAsync(cmd.UnidadeId, today, today.AddDays(1));

        return new DashboardSummaryDTO(totalToday, confirmados, pendentes, finalizadosMes, faturamentoMes, finalizadosHoje, faturamentoHoje);
    }
}

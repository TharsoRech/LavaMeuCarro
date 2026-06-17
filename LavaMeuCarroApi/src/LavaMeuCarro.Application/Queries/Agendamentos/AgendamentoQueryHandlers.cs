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
        string? funcImage = null;
        if (func != null && funcUsers.TryGetValue(func.UserId, out var funcUser))
        {
            funcName = funcUser.Name;
            funcImage = funcUser.Base64Image;
        }

        return new AgendamentoDTO(a.Id, a.ClientId, a.FuncionarioId, a.ServicoId, a.UnidadeId,
            a.VeiculoId, a.ScheduledAt, a.DurationMinutes, a.TotalPrice, a.Status, a.Modalidade,
            a.TaxaDeslocamento, a.PrecoBruto, a.Desconto, a.PrecoAdicionais, a.Notes,
            a.CancellationReason, a.CreatedAt, a.VistoriaFotos, a.VistoriaObservacoes,
            a.VistoriaData, a.RetiradoPor, a.NomeAutorizado, a.DocumentoAutorizado,
            a.RetiradaEm,
            client?.Name, client?.Phone, null, client?.Base64Image,
            funcName, funcImage,
            servico?.Name,
            unidade?.Name, unidade?.LogoUrl, unidade?.WhatsApp, unidade?.Address,
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
        System.Console.WriteLine($"[GetAgendamentoById] Querying id={cmd.Id}, userId={cmd.UserId}");
        var a = await _repo.GetByIdAsync(cmd.Id);
        System.Console.WriteLine($"[GetAgendamentoById] Result: {a?.Id ?? 0}, unidadeId={a?.UnidadeId ?? 0}");
        
        if (a == null)
        {
            System.Console.WriteLine($"[GetAgendamentoById] NOT FOUND - id={cmd.Id}");
            throw new NotFoundException("Appointment not found");
        }

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
    private readonly IUserRepository _userRepo;
    private readonly IServicoRepository _servicoRepo;
    private readonly IFuncionarioRepository _funcionarioRepo;

    public GetDashboardSummaryHandler(
        IAgendamentoRepository repo,
        IUserRepository userRepo,
        IServicoRepository servicoRepo,
        IFuncionarioRepository funcionarioRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
        _servicoRepo = servicoRepo;
        _funcionarioRepo = funcionarioRepo;
    }

    public async Task<DashboardSummaryDTO> Handle(GetDashboardSummaryQuery cmd, CancellationToken ct)
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var totalToday = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Confirmed, today, today.AddDays(1))
            + await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Pending, today, today.AddDays(1))
            + await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.InProgress, today, today.AddDays(1))
            + await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Ready, today, today.AddDays(1));

        var confirmados = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Confirmed, today, today.AddDays(1));
        var pendentes = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Pending, null, null);
        var finalizadosMes = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Completed, monthStart, today.AddDays(1));
        var finalizadosHoje = await _repo.CountByStatusAsync(cmd.UnidadeId, AgendamentoStatus.Completed, today, today.AddDays(1));
        var faturamentoMes = await _repo.SumByUnidadeAsync(cmd.UnidadeId, monthStart, today.AddDays(1));
        var faturamentoHoje = await _repo.SumByUnidadeAsync(cmd.UnidadeId, today, today.AddDays(1));

        // Get upcoming appointments (pending and confirmed from now onwards)
        var upcomingAppointments = new List<UpcomingAppointmentDTO>();
        try
        {
            var upcoming = await _repo.GetByUnidadeAsync(cmd.UnidadeId, null, null);
            var upcomingFiltered = upcoming
                .Where(a => a.ScheduledAt >= DateTime.Now && 
                           (a.Status == AgendamentoStatus.Pending || 
                            a.Status == AgendamentoStatus.Confirmed))
                .OrderBy(a => a.ScheduledAt)
                .Take(10)
                .ToList();

            if (upcomingFiltered.Any())
            {
                var clientIds = upcomingFiltered.Select(a => a.ClientId).Distinct().ToList();
                var servicoIds = upcomingFiltered.Select(a => a.ServicoId).Distinct().ToList();
                var funcionarioIds = upcomingFiltered.Select(a => a.FuncionarioId).Distinct().ToList();

                var users = (await _userRepo.GetByIdsAsync(clientIds)).ToDictionary(u => u.Id);
                var servicos = (await _servicoRepo.GetByIdsAsync(servicoIds)).ToDictionary(s => s.Id);
                var funcionarios = (await _funcionarioRepo.GetByIdsAsync(funcionarioIds)).ToDictionary(f => f.Id);

                var funcUserIds = funcionarios.Values.Select(f => f.UserId).Distinct().ToList();
                var funcUsers = funcUserIds.Any()
                    ? (await _userRepo.GetByIdsAsync(funcUserIds)).ToDictionary(u => u.Id)
                    : new Dictionary<int, User>();

                upcomingAppointments = upcomingFiltered.Select(a =>
                {
                    users.TryGetValue(a.ClientId, out var client);
                    servicos.TryGetValue(a.ServicoId, out var servico);
                    funcionarios.TryGetValue(a.FuncionarioId, out var func);
                    
                    string? funcName = null;
                    if (func != null && funcUsers.TryGetValue(func.UserId, out var fu))
                        funcName = fu.Name;

                    return new UpcomingAppointmentDTO(
                        a.Id,
                        client?.Name ?? "Cliente",
                        servico?.Name ?? "Serviço",
                        funcName ?? "Profissional",
                        a.ScheduledAt,
                        a.Status.ToString()
                    );
                }).ToList();
            }
        }
        catch
        {
            // If upcoming appointments fail, continue with empty list
        }

        return new DashboardSummaryDTO(
            totalToday, 
            confirmados, 
            pendentes, 
            finalizadosMes, 
            faturamentoMes, 
            finalizadosHoje, 
            faturamentoHoje,
            upcomingAppointments
        );
    }
}

public class GetClientAppointmentHistoryHandler : IRequestHandler<GetClientAppointmentHistoryQuery, ClientAppointmentHistoryDTO>
{
    private readonly IAgendamentoRepository _repo;
    private readonly IServicoRepository _servicoRepo;
    private readonly IFuncionarioRepository _funcionarioRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUnidadeRepository _unidadeRepo;

    public GetClientAppointmentHistoryHandler(IAgendamentoRepository repo, IServicoRepository servicoRepo,
        IFuncionarioRepository funcionarioRepo, IUserRepository userRepo, IUnidadeRepository unidadeRepo)
    {
        _repo = repo; _servicoRepo = servicoRepo; _funcionarioRepo = funcionarioRepo;
        _userRepo = userRepo; _unidadeRepo = unidadeRepo;
    }

    public async Task<ClientAppointmentHistoryDTO> Handle(GetClientAppointmentHistoryQuery cmd, CancellationToken ct)
    {
        var appointments = await _repo.GetByClientAndUnidadeAsync(cmd.ClientId, cmd.UnidadeId);
        if (appointments.Count == 0)
            return new ClientAppointmentHistoryDTO(new List<ClientAppointmentHistoryItemDTO>());

        var servicoIds = appointments.Select(a => a.ServicoId).Distinct().ToList();
        var funcionarioIds = appointments.Select(a => a.FuncionarioId).Distinct().ToList();

        var servicos = (await _servicoRepo.GetByIdsAsync(servicoIds)).ToDictionary(s => s.Id);
        var funcionarios = (await _funcionarioRepo.GetByIdsAsync(funcionarioIds)).ToDictionary(f => f.Id);
        var funcUserIds = funcionarios.Values.Select(f => f.UserId).Distinct().ToList();
        var funcUsers = funcUserIds.Count > 0
            ? (await _userRepo.GetByIdsAsync(funcUserIds)).ToDictionary(u => u.Id)
            : new Dictionary<int, User>();

        var items = appointments.Select(a =>
        {
            servicos.TryGetValue(a.ServicoId, out var servico);
            funcionarios.TryGetValue(a.FuncionarioId, out var func);
            string? funcName = null;
            if (func != null && funcUsers.TryGetValue(func.UserId, out var fu)) funcName = fu.Name;
            return new ClientAppointmentHistoryItemDTO(
                a.Id, a.ScheduledAt.ToString("yyyy-MM-dd HH:mm"), a.Status.ToString(),
                servico?.Name, funcName, null, a.DurationMinutes, a.TotalPrice,
                a.CancellationReason, a.Notes);
        }).ToList();

        return new ClientAppointmentHistoryDTO(items);
    }
}

public class GetEligibleProfessionalsHandler : IRequestHandler<GetEligibleProfessionalsQuery, List<ProfessionalOptionDTO>>
{
    private readonly IAgendamentoRepository _repo;
    private readonly IFuncionarioRepository _funcionarioRepo;
    private readonly IUserRepository _userRepo;

    public GetEligibleProfessionalsHandler(IAgendamentoRepository repo, IFuncionarioRepository funcionarioRepo, IUserRepository userRepo)
    {
        _repo = repo; _funcionarioRepo = funcionarioRepo; _userRepo = userRepo;
    }

    public async Task<List<ProfessionalOptionDTO>> Handle(GetEligibleProfessionalsQuery cmd, CancellationToken ct)
    {
        var ag = await _repo.GetByIdAsync(cmd.AgendamentoId)
            ?? throw new Domain.Exceptions.NotFoundException("Appointment not found");

        // Get all active professionals at the same unit
        var funcionarios = await _funcionarioRepo.GetByUnidadeAsync(ag.UnidadeId);
        var activeFuncs = funcionarios.Where(f => f.Active).ToList();

        if (activeFuncs.Count == 0) return new List<ProfessionalOptionDTO>();

        var userIds = activeFuncs.Select(f => f.UserId).ToList();
        var users = (await _userRepo.GetByIdsAsync(userIds)).ToDictionary(u => u.Id);

        return activeFuncs.Select(f =>
        {
            users.TryGetValue(f.UserId, out var user);
            return new ProfessionalOptionDTO(f.Id, user?.Name ?? "Profissional", user?.Base64Image);
        }).ToList();
    }
}

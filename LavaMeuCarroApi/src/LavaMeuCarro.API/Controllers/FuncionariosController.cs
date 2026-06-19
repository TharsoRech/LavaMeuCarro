using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/funcionarios")]
[Authorize]
public class FuncionariosController : ControllerBase
{
    private readonly IFuncionarioRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IAvaliacaoRepository _avaliacaoRepo;
    private readonly IFuncionarioServicoRepository _funcionarioServicoRepo;
    
    public FuncionariosController(
        IFuncionarioRepository repo, 
        IUserRepository userRepo,
        IAvaliacaoRepository avaliacaoRepo,
        IFuncionarioServicoRepository funcionarioServicoRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
        _avaliacaoRepo = avaliacaoRepo;
        _funcionarioServicoRepo = funcionarioServicoRepo;
    }

    [HttpGet]
    public async Task<ActionResult<List<FuncionarioDTO>>> GetByUnidade([FromQuery] int unidadeId)
    {
        var funcionarios = await _repo.GetByUnidadeAsync(unidadeId);
        var userIds = funcionarios.Select(f => f.UserId).Distinct().ToList();
        var users = userIds.Count > 0
            ? (await _userRepo.GetByIdsAsync(userIds)).ToDictionary(u => u.Id)
            : new Dictionary<int, User>();
        
        // Calcula avaliacoes dinamicamente para garantir dados atualizados
        var funcionarioIds = funcionarios.Select(f => f.Id).ToList();
        var statsByFuncionario = new Dictionary<int, (int Total, double AvgRating)>();
        
        if (funcionarioIds.Count > 0)
        {
            // Busca todas as avaliacoes e agrupa
            foreach (var funcId in funcionarioIds)
            {
                var reviews = await _avaliacaoRepo.GetByFuncionarioAsync(funcId);
                if (reviews.Count > 0)
                {
                    var avg = reviews.Average(r => r.Rating);
                    statsByFuncionario[funcId] = (reviews.Count, avg);
                }
            }
        }
        
        // Busca ServiceIds de todos os funcionarios de uma vez (otimizacao para evitar N+1)
        var serviceIdsByFuncionario = new Dictionary<int, List<int>>();
        foreach (var f in funcionarios)
        {
            serviceIdsByFuncionario[f.Id] = await _funcionarioServicoRepo.GetServicoIdsByFuncionarioAsync(f.Id);
        }
        
        return Ok(funcionarios.Select(f =>
        {
            users.TryGetValue(f.UserId, out var user);
            var hasStats = statsByFuncionario.TryGetValue(f.Id, out var stats);
            
            // Usa stats calculados se existirem, senao usa os campos do banco
            decimal? averageRating = hasStats ? (decimal?)stats.AvgRating : f.AverageRating;
            int totalReviews = hasStats ? stats.Total : f.TotalReviews;
            
            // Parse AvailableTimes para Schedule (Dictionary<string, string[]>)
            Dictionary<string, string[]>? schedule = null;
            if (!string.IsNullOrEmpty(f.AvailableTimes))
            {
                try
                {
                    // Tenta parsear como Dictionary<string, string[]> primeiro
                    schedule = JsonSerializer.Deserialize<Dictionary<string, string[]>>(f.AvailableTimes);
                    
                    // Se falhar ou vier vazio, tenta parsear como array (formato antigo)
                    if (schedule == null || schedule.Count == 0)
                    {
                        var times = JsonSerializer.Deserialize<string[]>(f.AvailableTimes);
                        if (times != null && times.Length > 0)
                        {
                            schedule = new Dictionary<string, string[]> { { "1", times } };
                        }
                    }
                }
                catch { /* ignore parse errors */ }
            }
            
            // Busca ServiceIds do funcionario
            serviceIdsByFuncionario.TryGetValue(f.Id, out var serviceIds);
            
            return new FuncionarioDTO(f.Id, f.UserId, f.UnidadeId, f.Specialty, f.Bio, averageRating, totalReviews, f.Active, f.AvailableTimes, f.IsAdmin, user?.Name, user?.Phone, user?.Base64Image, schedule, user?.Doc, serviceIds);
        }));
    }

    [AllowAnonymous]
    [HttpGet("popular")]
    public async Task<ActionResult> GetPopular([FromQuery] int limit = 10)
    {
        var results = await _repo.GetPopularAsync(limit);
        return Ok(results.Select(r => new PopularProfessionalDTO(
            r.Funcionario.Id,
            r.Funcionario.UserId,
            r.Funcionario.UnidadeId,
            r.UserName,
            r.UnidadeName,
            r.Funcionario.Specialty,
            r.Funcionario.AverageRating,
            r.Funcionario.TotalReviews
        )));
    }

    [HttpPost]
    public async Task<ActionResult<int>> Create([FromBody] CreateFuncionarioByDocRequest request)
    {
        System.Console.WriteLine($"[Funcionario Create] Doc={request.Doc}, Name={request.Name}, UnidadeId={request.UnidadeId}");
        
        // Create a user for the funcionario
        var user = new User
        {
            Name = request.Name ?? $"Profissional_{request.Doc}",
            Email = $"func_{Guid.NewGuid():N}@lavemeucarro.local",
            Phone = null,
            Type = UserType.Profissional,
            Active = true,
            Doc = request.Doc,
            Dob = null,
            Country = "Brasil",
            Base64Image = request.Base64Image
        };
        var userId = await _userRepo.CreateAsync(user);

        var funcionario = new Funcionario
        {
            UserId = userId,
            UnidadeId = request.UnidadeId,
            Specialty = request.Specialty,
            Bio = request.Bio,
            Active = true,
            IsAdmin = request.IsAdmin,
            AvailableTimes = request.AvailableTimes
        };
        var id = await _repo.CreateAsync(funcionario);
        
        // Salva serviços vinculados ao funcionario
        if (request.ServiceIds != null && request.ServiceIds.Count > 0)
        {
            await _funcionarioServicoRepo.SetServicosAsync(id, request.ServiceIds);
            System.Console.WriteLine($"[Funcionario Create] Saved {request.ServiceIds.Count} services");
        }
        
        System.Console.WriteLine($"[Funcionario Create] SUCCESS: ID={id}, UserId={userId}");
        return Ok(id);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateFuncionarioRequest request)
    {
        System.Console.WriteLine($"[Funcionario Update] ID={id}");
        System.Console.WriteLine($"[Funcionario Update] ModelState Valid: {ModelState.IsValid}");
        if (!ModelState.IsValid)
        {
            var errors = string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            System.Console.WriteLine($"[Funcionario Update] ModelState Errors: {errors}");
            return BadRequest(ModelState);
        }
        
        System.Console.WriteLine($"[Funcionario Update] Received: Name={request.Name}, Specialty={request.Specialty}, HasImage={request.Base64Image != null}, AvailableTimes={request.AvailableTimes?.Substring(0, Math.Min(30, request.AvailableTimes?.Length ?? 0))}");
        
        var funcionario = await _repo.GetByIdAsync(id);
        if (funcionario == null) return NotFound();
        
        // Atualiza Funcionario
        if (request.Specialty != null) funcionario.Specialty = request.Specialty;
        if (request.Bio != null) funcionario.Bio = request.Bio;
        if (request.Active != null) funcionario.Active = request.Active.Value;
        if (request.AvailableTimes != null) funcionario.AvailableTimes = request.AvailableTimes;
        if (request.IsAdmin != null) funcionario.IsAdmin = request.IsAdmin.Value;
        await _repo.UpdateAsync(funcionario);
        System.Console.WriteLine($"[Funcionario Update] Updated Funcionario");
        
        // Atualiza User (Nome e Foto)
        var user = await _userRepo.GetByIdAsync(funcionario.UserId);
        if (user != null)
        {
            if (request.Name != null) user.Name = request.Name;
            if (request.Base64Image != null) user.Base64Image = request.Base64Image;
            await _userRepo.UpdateAsync(user);
            System.Console.WriteLine($"[Funcionario Update] Updated User: Name={user.Name}");
        }
        
        // Atualiza serviços vinculados (se fornecidos)
        if (request.ServiceIds != null)
        {
            await _funcionarioServicoRepo.SetServicosAsync(id, request.ServiceIds);
            System.Console.WriteLine($"[Funcionario Update] Saved {request.ServiceIds.Count} services");
        }
        
        System.Console.WriteLine($"[Funcionario Update] SUCCESS");
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return Ok();
    }

    /// <summary>
    /// Get reviews for a specific professional
    /// </summary>
    [HttpGet("{id}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ReviewDTO>>> GetProfessionalReviews(int id)
    {
        var reviews = await _avaliacaoRepo.GetByFuncionarioAsync(id);
        
        if (reviews.Count == 0)
        {
            return Ok(new List<ReviewDTO>());
        }

        // Get client names
        var clientIds = reviews.Select(r => r.ClientId).Distinct().ToList();
        var users = await _userRepo.GetByIdsAsync(clientIds);
        var userDict = users.ToDictionary(u => u.Id);

        var result = reviews.Select(r =>
        {
            userDict.TryGetValue(r.ClientId, out var client);
            return new ReviewDTO(
                r.Id,
                r.ClientId,
                r.FuncionarioId ?? 0,
                "funcionario",
                r.Rating,
                r.Comment,
                client?.Name,
                r.CreatedAt
            );
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Get available time options for a salon's professionals
    /// </summary>
    [HttpGet("time-options")]
    [AllowAnonymous]
    public async Task<ActionResult<List<string>>> GetTimeOptions([FromQuery] int? salonId = null)
    {
        if (!salonId.HasValue)
        {
            // Return default time options if no salon specified
            return Ok(GetDefaultTimeOptions());
        }

        // Get salon to check if it has custom time options
        // For now, return default time options
        // TODO: Fetch from salon configuration if needed
        return Ok(GetDefaultTimeOptions());
    }

    private List<string> GetDefaultTimeOptions()
    {
        return new List<string>
        {
            "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
            "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
            "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
            "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
            "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
        };
    }
}

public record CreateFuncionarioByNomeRequest(string Nome, int UnidadeId, string? Specialty, bool Active);

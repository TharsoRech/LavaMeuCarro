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
    
    public FuncionariosController(
        IFuncionarioRepository repo, 
        IUserRepository userRepo,
        IAvaliacaoRepository avaliacaoRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
        _avaliacaoRepo = avaliacaoRepo;
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
        
        return Ok(funcionarios.Select(f =>
        {
            users.TryGetValue(f.UserId, out var user);
            var hasStats = statsByFuncionario.TryGetValue(f.Id, out var stats);
            
            // Usa stats calculados se existirem, senao usa os campos do banco
            decimal? averageRating = hasStats ? (decimal?)stats.AvgRating : f.AverageRating;
            int totalReviews = hasStats ? stats.Total : f.TotalReviews;
            
            return new FuncionarioDTO(f.Id, f.UserId, f.UnidadeId, f.Specialty, f.Bio, averageRating, totalReviews, f.Active, f.AvailableTimes, f.IsAdmin, user?.Name, user?.Phone);
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
    public async Task<ActionResult<int>> Create([FromBody] CreateFuncionarioByNomeRequest request)
    {
        // Create a stub user for the funcionario
        var user = new User
        {
            Name = request.Nome,
            Email = $"func_{Guid.NewGuid():N}@lavemeucarro.local",
            Phone = null,
            Type = UserType.Profissional,
            Active = true,
            Doc = null,
            Dob = null,
            Country = "Brasil"
        };
        var userId = await _userRepo.CreateAsync(user);

        var funcionario = new Funcionario
        {
            UserId = userId,
            UnidadeId = request.UnidadeId,
            Specialty = request.Specialty,
            Bio = null,
            Active = request.Active,
            IsAdmin = false
        };
        var id = await _repo.CreateAsync(funcionario);
        return Ok(id);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateFuncionarioRequest request)
    {
        var funcionario = await _repo.GetByIdAsync(id);
        if (funcionario == null) return NotFound();
        
        // Atualiza Funcionario
        if (request.Specialty != null) funcionario.Specialty = request.Specialty;
        if (request.Bio != null) funcionario.Bio = request.Bio;
        if (request.Active != null) funcionario.Active = request.Active.Value;
        await _repo.UpdateAsync(funcionario);
        
        // TODO: Atualizar Nome e Foto do User quando o DTO tiver os campos
        
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
public record UpdateFuncionarioRequest(string? Specialty, string? Bio, bool? Active);

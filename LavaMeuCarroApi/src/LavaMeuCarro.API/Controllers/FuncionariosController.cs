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
    public FuncionariosController(IFuncionarioRepository repo, IUserRepository userRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
    }

    [HttpGet]
    public async Task<ActionResult<List<FuncionarioDTO>>> GetByUnidade([FromQuery] int unidadeId)
    {
        var funcionarios = await _repo.GetByUnidadeAsync(unidadeId);
        var userIds = funcionarios.Select(f => f.UserId).Distinct().ToList();
        var users = userIds.Count > 0
            ? (await _userRepo.GetByIdsAsync(userIds)).ToDictionary(u => u.Id)
            : new Dictionary<int, User>();
        return Ok(funcionarios.Select(f =>
        {
            users.TryGetValue(f.UserId, out var user);
            return new FuncionarioDTO(f.Id, f.UserId, f.UnidadeId, f.Specialty, f.Bio, f.AverageRating, f.TotalReviews, f.Active, f.AvailableTimes, f.IsAdmin, user?.Name, user?.Phone);
        }));
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
        if (request.Specialty != null) funcionario.Specialty = request.Specialty;
        if (request.Bio != null) funcionario.Bio = request.Bio;
        if (request.Active != null) funcionario.Active = request.Active.Value;
        await _repo.UpdateAsync(funcionario);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return Ok();
    }
}

public record CreateFuncionarioByNomeRequest(string Nome, int UnidadeId, string? Specialty, bool Active);
public record UpdateFuncionarioRequest(string? Specialty, string? Bio, bool? Active);

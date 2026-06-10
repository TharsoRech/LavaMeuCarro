using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/funcionarios")]
[Authorize]
public class FuncionariosController : ControllerBase
{
    private readonly IFuncionarioRepository _repo;
    public FuncionariosController(IFuncionarioRepository repo) => _repo = repo;

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

public record UpdateFuncionarioRequest(string? Specialty, string? Bio, bool? Active);

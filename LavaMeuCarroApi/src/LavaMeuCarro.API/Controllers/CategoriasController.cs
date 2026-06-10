using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/categorias")]
public class CategoriasController : ControllerBase
{
    private readonly ICategoriaRepository _repo;
    public CategoriasController(ICategoriaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<List<CategoriaDTO>>> GetAll()
    {
        var items = await _repo.GetAllAsync();
        return Ok(items.Select(c => new CategoriaDTO(c.Id, c.Name, c.IconUrl, c.Active)));
    }
}

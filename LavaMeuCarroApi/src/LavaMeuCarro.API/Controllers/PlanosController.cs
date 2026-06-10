using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.API.Controllers;

/// <summary>Subscription plans</summary>
[ApiController]
[Route("api/planos")]
public class PlanosController : ControllerBase
{
    private readonly IPlanoRepository _repo;
    public PlanosController(IPlanoRepository repo) => _repo = repo;

    /// <summary>List all available plans (public)</summary>
    [HttpGet]
    public async Task<ActionResult<List<PlanoDTO>>> GetAll()
    {
        var items = await _repo.GetAllAsync();
        return Ok(items.Where(p => p.Active).Select(p => new PlanoDTO(p.Id, p.Name, p.Description, p.Price, p.PeriodDays, p.AppointmentLimit, p.Active)));
    }
}

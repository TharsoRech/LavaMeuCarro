using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Queries.Unidades;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/unidades")]
public class UnidadesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUnidadeRepository _repo;

    public UnidadesController(IMediator mediator, IUnidadeRepository repo)
    {
        _mediator = mediator;
        _repo = repo;
    }

    [HttpGet]
    public async Task<ActionResult<List<UnidadeDTO>>> GetAll([FromQuery] string? city, [FromQuery] string? search)
        => Ok(await _mediator.Send(new GetAllUnidadesQuery(city, search)));

    [HttpGet("paged")]
    public async Task<ActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? city = null, [FromQuery] string? search = null)
    {
        var (items, total) = await _mediator.Send(new GetPagedUnidadesQuery(page, pageSize, city, search));
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UnidadeDTO>> GetById(int id)
        => Ok(await _mediator.Send(new GetUnidadeByIdQuery(id)));

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<List<UnidadeDTO>>> GetMine()
    {
        var ownerId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        return Ok(await _mediator.Send(new GetMyUnidadesQuery(ownerId)));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<int>> Create([FromBody] CreateUnidadeRequest request)
    {
        var ownerId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var unidade = new Unidade { OwnerId = ownerId, Name = request.Name, Description = request.Description, LogoUrl = request.LogoUrl, Address = request.Address ?? string.Empty, Number = request.Number, Complement = request.Complement, Neighborhood = request.Neighborhood, ReferencePoint = request.ReferencePoint, City = request.City ?? string.Empty, State = request.State ?? string.Empty, ZipCode = request.ZipCode, Latitude = request.Latitude, Longitude = request.Longitude, Phone = request.Phone, Email = request.Email, BusinessHours = request.BusinessHours, Gallery = request.Gallery, WhatsApp = request.WhatsApp, InstagramUrl = request.InstagramUrl, SchedulingTimeOptions = request.SchedulingTimeOptions, SchedulingTimeInterval = request.SchedulingTimeInterval ?? 30, OfereceLevaTraz = request.OfereceLevaTraz, RaioMaximoKm = request.RaioMaximoKm ?? 10, TipoTaxaDeslocamento = request.TipoTaxaDeslocamento, TaxaDeslocamento = request.TaxaDeslocamento };
        var id = await _repo.CreateAsync(unidade);
        return Ok(id);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateUnidadeRequest request)
    {
        var unidade = await _repo.GetByIdAsync(id);
        if (unidade == null) return NotFound();
        if (request.Name != null) unidade.Name = request.Name;
        if (request.Description != null) unidade.Description = request.Description;
        if (request.LogoUrl != null) unidade.LogoUrl = request.LogoUrl;
        if (request.Address != null) unidade.Address = request.Address;
        if (request.Number != null) unidade.Number = request.Number;
        if (request.Complement != null) unidade.Complement = request.Complement;
        if (request.Neighborhood != null) unidade.Neighborhood = request.Neighborhood;
        if (request.ReferencePoint != null) unidade.ReferencePoint = request.ReferencePoint;
        if (request.City != null) unidade.City = request.City;
        if (request.State != null) unidade.State = request.State;
        if (request.ZipCode != null) unidade.ZipCode = request.ZipCode;
        if (request.Latitude != null) unidade.Latitude = request.Latitude;
        if (request.Longitude != null) unidade.Longitude = request.Longitude;
        if (request.Phone != null) unidade.Phone = request.Phone;
        if (request.Email != null) unidade.Email = request.Email;
        if (request.BusinessHours != null) unidade.BusinessHours = request.BusinessHours;
        if (request.Gallery != null) unidade.Gallery = request.Gallery;
        if (request.WhatsApp != null) unidade.WhatsApp = request.WhatsApp;
        if (request.InstagramUrl != null) unidade.InstagramUrl = request.InstagramUrl;
        if (request.SchedulingTimeOptions != null) unidade.SchedulingTimeOptions = request.SchedulingTimeOptions;
        if (request.SchedulingTimeInterval != null) unidade.SchedulingTimeInterval = request.SchedulingTimeInterval.Value;
        if (request.OfereceLevaTraz != null) unidade.OfereceLevaTraz = request.OfereceLevaTraz.Value;
        if (request.RaioMaximoKm != null) unidade.RaioMaximoKm = request.RaioMaximoKm.Value;
        if (request.TipoTaxaDeslocamento != null) unidade.TipoTaxaDeslocamento = request.TipoTaxaDeslocamento;
        if (request.TaxaDeslocamento != null) unidade.TaxaDeslocamento = request.TaxaDeslocamento;
        if (request.Active != null) unidade.Active = request.Active.Value;
        if (request.Published != null) unidade.Published = request.Published.Value;
        await _repo.UpdateAsync(unidade);
        return Ok();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return Ok();
    }

    [HttpGet("popular")]
    public async Task<ActionResult<List<UnidadeDTO>>> GetPopular([FromQuery] int limit = 10)
        => Ok((await _repo.GetPopularAsync(limit)).Select(u => new UnidadeDTO(u.Id, u.OwnerId, u.Name, u.Description, u.LogoUrl, u.Address, u.Number, u.Complement, u.Neighborhood, u.ReferencePoint, u.City, u.State, u.ZipCode, u.Latitude, u.Longitude, u.Phone, u.Email, u.BusinessHours, u.Active, u.Published, u.Rating, u.Reviews, u.Gallery, u.AverageRating, u.WhatsApp, u.InstagramUrl, u.SchedulingTimeOptions, u.SchedulingTimeInterval, u.OfereceLevaTraz, u.RaioMaximoKm, u.TipoTaxaDeslocamento, u.TaxaDeslocamento, u.CreatedAt)).ToList());
}

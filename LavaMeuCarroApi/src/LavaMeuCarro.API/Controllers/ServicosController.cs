using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Exceptions;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/unidades/{unidadeId}/servicos")]
public class ServicosController : ControllerBase
{
    private readonly IServicoRepository _repo;
    public ServicosController(IServicoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<List<ServicoDTO>>> GetAll(int unidadeId)
    {
        var servicos = await _repo.GetByUnidadeAsync(unidadeId);
        return Ok(servicos.Select(s => new ServicoDTO(s.Id, s.UnidadeId, s.CategoryId, s.Name, s.Description, s.Price, s.DurationMinutes, s.Active, s.Icon, s.PrecoHatch, s.DuracaoHatch, s.PrecoSedan, s.DuracaoSedan, s.PrecoSUV, s.DuracaoSUV, s.PrecoPicape, s.DuracaoPicape, s.PrecoMoto, s.DuracaoMoto, s.IsPromotion, s.PromoPrice, s.PromoStartDate, s.PromoEndDate, s.PromoDescription, null)));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<int>> Create(int unidadeId, [FromBody] CreateServicoRequest request)
    {
        var servico = new Servico { UnidadeId = unidadeId, CategoryId = request.CategoryId, Name = request.Name, Description = request.Description, Price = request.Price, DurationMinutes = request.DurationMinutes, Icon = request.Icon, PrecoHatch = request.PrecoHatch, DuracaoHatch = request.DuracaoHatch, PrecoSedan = request.PrecoSedan, DuracaoSedan = request.DuracaoSedan, PrecoSUV = request.PrecoSUV, DuracaoSUV = request.DuracaoSUV, PrecoPicape = request.PrecoPicape, DuracaoPicape = request.DuracaoPicape, PrecoMoto = request.PrecoMoto, DuracaoMoto = request.DuracaoMoto, IsPromotion = request.IsPromotion, PromoPrice = request.PromoPrice, PromoStartDate = request.PromoStartDate, PromoEndDate = request.PromoEndDate, PromoDescription = request.PromoDescription };
        return Ok(await _repo.CreateAsync(servico));
    }

    [HttpPut("{serviceId}")]
    [Authorize]
    public async Task<ActionResult> Update(int unidadeId, int serviceId, [FromBody] UpdateServicoRequest request)
    {
        var servico = await _repo.GetByIdAsync(serviceId) ?? throw new NotFoundException("Service not found");
        if (request.Name != null) servico.Name = request.Name;
        if (request.Price != null) servico.Price = request.Price.Value;
        if (request.DurationMinutes != null) servico.DurationMinutes = request.DurationMinutes.Value;
        if (request.Active != null) servico.Active = request.Active.Value;
        await _repo.UpdateAsync(servico);
        return Ok();
    }

    [HttpDelete("{serviceId}")]
    [Authorize]
    public async Task<ActionResult> Delete(int unidadeId, int serviceId)
    {
        await _repo.DeleteAsync(serviceId);
        return Ok();
    }
}

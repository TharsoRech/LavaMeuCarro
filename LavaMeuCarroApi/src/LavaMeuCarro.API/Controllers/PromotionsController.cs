using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/promotions")]
public class PromotionsController : ControllerBase
{
    private readonly IServicoRepository _servicoRepo;
    private readonly IUnidadeRepository _unidadeRepo;

    public PromotionsController(IServicoRepository servicoRepo, IUnidadeRepository unidadeRepo)
    {
        _servicoRepo = servicoRepo;
        _unidadeRepo = unidadeRepo;
    }

    [HttpGet]
    public async Task<ActionResult<List<PromotionDTO>>> GetActive(
        [FromQuery] int limit = 10)
    {
        var servicos = await _servicoRepo.GetPromotionsAsync(limit);
        var result = new List<PromotionDTO>();

        foreach (var s in servicos)
        {
            var unidade = await _unidadeRepo.GetByIdAsync(s.UnidadeId);
            result.Add(new PromotionDTO(
                s.Id,
                s.Name,
                s.Description,
                s.Price,
                s.PromoPrice,
                s.PromoEndDate?.ToString("yyyy-MM-dd"),
                s.PromoDescription,
                s.DurationMinutes,
                s.UnidadeId,
                unidade?.Name ?? "",
                unidade?.City ?? "",
                unidade?.AverageRating,
                unidade?.LogoUrl
            ));
        }

        return Ok(result);
    }
}

public record PromotionDTO(
    int ServicoId,
    string Name,
    string? Description,
    decimal OriginalPrice,
    decimal? PromoPrice,
    string? PromoEndDate,
    string? PromoDescription,
    int DurationMinutes,
    int UnidadeId,
    string UnidadeName,
    string UnidadeCity,
    decimal? AverageRating,
    string? UnidadeLogoUrl
);

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
        [FromQuery] int limit = 10,
        [FromQuery] double? lat = null,
        [FromQuery] double? lng = null,
        [FromQuery] double? radius = null)
    {
        var servicos = await _servicoRepo.GetPromotionsAsync(limit);
        var result = new List<PromotionDTO>();

        foreach (var s in servicos)
        {
            var unidade = await _unidadeRepo.GetByIdAsync(s.UnidadeId);
            
            // Filter by location if coordinates provided
            if (lat.HasValue && lng.HasValue && radius.HasValue && unidade != null && unidade.Latitude.HasValue && unidade.Longitude.HasValue)
            {
                var distance = CalculateDistance(
                    lat.Value, 
                    lng.Value, 
                    (double)unidade.Latitude.Value, 
                    (double)unidade.Longitude.Value);
                if (distance > radius.Value)
                    continue; // Skip this promotion - out of radius
            }
            
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
                unidade?.LogoUrl,
                unidade?.Latitude,
                unidade?.Longitude
            ));
        }

        return Ok(result);
    }

    /// <summary>
    /// Calculate distance between two coordinates using Haversine formula (returns km)
    /// </summary>
    private double CalculateDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371; // Earth's radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double degrees) => degrees * Math.PI / 180;
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
    string? UnidadeLogoUrl,
    decimal? UnidadeLatitude = null,
    decimal? UnidadeLongitude = null
);

namespace LavaMeuCarro.Application.DTOs;

public record ServicoDTO(
    int Id, int UnidadeId, int CategoryId, string Name, string? Description,
    decimal Price, int DurationMinutes, bool Active, string? Icon,
    decimal? PrecoHatch, int? DuracaoHatch, decimal? PrecoSedan, int? DuracaoSedan,
    decimal? PrecoSUV, int? DuracaoSUV, decimal? PrecoPicape, int? DuracaoPicape,
    decimal? PrecoMoto, int? DuracaoMoto,
    bool IsPromotion, decimal? PromoPrice, DateTime? PromoStartDate,
    DateTime? PromoEndDate, string? PromoDescription, string? CategoryName
);

public record CreateServicoRequest(
    int CategoryId, string Name, string? Description, decimal Price,
    int DurationMinutes, string? Icon,
    decimal? PrecoHatch, int? DuracaoHatch, decimal? PrecoSedan, int? DuracaoSedan,
    decimal? PrecoSUV, int? DuracaoSUV, decimal? PrecoPicape, int? DuracaoPicape,
    decimal? PrecoMoto, int? DuracaoMoto,
    bool IsPromotion, decimal? PromoPrice, DateTime? PromoStartDate,
    DateTime? PromoEndDate, string? PromoDescription
);

public record UpdateServicoRequest(
    string? Name, string? Description, decimal? Price, int? DurationMinutes,
    bool? Active, string? Icon,
    decimal? PrecoHatch, int? DuracaoHatch, decimal? PrecoSedan, int? DuracaoSedan,
    decimal? PrecoSUV, int? DuracaoSUV, decimal? PrecoPicape, int? DuracaoPicape,
    decimal? PrecoMoto, int? DuracaoMoto,
    bool? IsPromotion, decimal? PromoPrice, DateTime? PromoStartDate,
    DateTime? PromoEndDate, string? PromoDescription
);

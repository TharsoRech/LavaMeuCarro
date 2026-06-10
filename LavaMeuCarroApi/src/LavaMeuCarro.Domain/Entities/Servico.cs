namespace LavaMeuCarro.Domain.Entities;

public class Servico
{
    public int Id { get; set; }
    public int UnidadeId { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Icon { get; set; }
    public decimal? PrecoHatch { get; set; }
    public int? DuracaoHatch { get; set; }
    public decimal? PrecoSedan { get; set; }
    public int? DuracaoSedan { get; set; }
    public decimal? PrecoSUV { get; set; }
    public int? DuracaoSUV { get; set; }
    public decimal? PrecoPicape { get; set; }
    public int? DuracaoPicape { get; set; }
    public decimal? PrecoMoto { get; set; }
    public int? DuracaoMoto { get; set; }
    public bool IsPromotion { get; set; }
    public decimal? PromoPrice { get; set; }
    public DateTime? PromoStartDate { get; set; }
    public DateTime? PromoEndDate { get; set; }
    public string? PromoDescription { get; set; }
}

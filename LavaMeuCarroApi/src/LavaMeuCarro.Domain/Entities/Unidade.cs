namespace LavaMeuCarro.Domain.Entities;

public class Unidade
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? ReferencePoint { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string? ZipCode { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? BusinessHours { get; set; }
    public bool Active { get; set; } = true;
    public bool Published { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? Rating { get; set; }
    public int Reviews { get; set; } = 0;
    public string? Gallery { get; set; }
    public bool UserHasVisited { get; set; }
    public bool IsAdmin { get; set; }
    public decimal? AverageRating { get; set; }
    public string? WhatsApp { get; set; }
    public string? InstagramUrl { get; set; }
    public string? SchedulingTimeOptions { get; set; }
    public int SchedulingTimeInterval { get; set; } = 30;
    public bool OfereceLevaTraz { get; set; } = false;
    public int RaioMaximoKm { get; set; } = 0;
    public string? TipoTaxaDeslocamento { get; set; }
    public decimal? TaxaDeslocamento { get; set; }
}

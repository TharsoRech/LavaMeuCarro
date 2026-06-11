namespace LavaMeuCarro.Application.DTOs;

public record UnidadeDTO(
    int Id, int OwnerId, string Name, string? Description, string? LogoUrl,
    string Address, string? Number, string? Complement, string? Neighborhood,
    string? ReferencePoint, string City, string State, string? ZipCode,
    decimal? Latitude, decimal? Longitude, string? Phone, string? Email,
    string? BusinessHours, bool Active, bool Published, string? Rating,
    int Reviews, string? Gallery, decimal? AverageRating, string? WhatsApp,
    string? InstagramUrl, string? SchedulingTimeOptions, int SchedulingTimeInterval,
    bool OfereceLevaTraz, int RaioMaximoKm, string? TipoTaxaDeslocamento,
    decimal? TaxaDeslocamento, DateTime CreatedAt
);

public record CreateUnidadeRequest(
    string Name, string? Description, string? LogoUrl, string? Address,
    string? Number, string? Complement, string? Neighborhood, string? ReferencePoint,
    string? City, string? State, string? ZipCode, decimal? Latitude, decimal? Longitude,
    string? Phone, string? Email, string? BusinessHours, string? Gallery,
    string? WhatsApp, string? InstagramUrl, string? SchedulingTimeOptions,
    int? SchedulingTimeInterval, bool OfereceLevaTraz, int? RaioMaximoKm,
    string? TipoTaxaDeslocamento, decimal? TaxaDeslocamento
);

public record UpdateUnidadeRequest(
    string? Name, string? Description, string? LogoUrl, string? Address,
    string? Number, string? Complement, string? Neighborhood, string? ReferencePoint,
    string? City, string? State, string? ZipCode, decimal? Latitude, decimal? Longitude,
    string? Phone, string? Email, string? BusinessHours, bool? Active, bool? Published,
    string? Gallery, string? WhatsApp, string? InstagramUrl,
    string? SchedulingTimeOptions, int? SchedulingTimeInterval,
    bool? OfereceLevaTraz, int? RaioMaximoKm, string? TipoTaxaDeslocamento,
    decimal? TaxaDeslocamento
);

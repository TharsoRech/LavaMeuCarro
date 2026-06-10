using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class UnidadeRepository : IUnidadeRepository
{
    private readonly IDbConnectionFactory _factory;
    public UnidadeRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Unidade?> GetByIdAsync(int id)
    {
        using var db = _factory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<Unidade>("SELECT * FROM Unidades WHERE Id = @Id", new { Id = id });
    }

    public async Task<List<Unidade>> GetAllAsync(string? city, string? search)
    {
        using var db = _factory.CreateConnection();
        var sql = "SELECT * FROM Unidades WHERE Active = 1 AND (@City IS NULL OR City = @City) AND (@Search IS NULL OR Name LIKE @Search) ORDER BY Name";
        return (await db.QueryAsync<Unidade>(sql, new { City = city, Search = search != null ? $"%{search}%" : null })).ToList();
    }

    public async Task<List<Unidade>> GetByOwnerAsync(int ownerId)
    {
        using var db = _factory.CreateConnection();
        return (await db.QueryAsync<Unidade>("SELECT * FROM Unidades WHERE OwnerId = @OwnerId ORDER BY Name", new { OwnerId = ownerId })).ToList();
    }

    public async Task<int> CreateAsync(Unidade unidade)
    {
        using var db = _factory.CreateConnection();
        var sql = @"INSERT INTO Unidades (OwnerId, Name, Description, LogoUrl, Address, Number, Complement, Neighborhood, ReferencePoint, City, State, ZipCode, Latitude, Longitude, Phone, Email, BusinessHours, Active, Published, Gallery, WhatsApp, InstagramUrl, SchedulingTimeOptions, SchedulingTimeInterval, OfereceLevaTraz, RaioMaximoKm, TipoTaxaDeslocamento, TaxaDeslocamento, CreatedAt)
                    VALUES (@OwnerId, @Name, @Description, @LogoUrl, @Address, @Number, @Complement, @Neighborhood, @ReferencePoint, @City, @State, @ZipCode, @Latitude, @Longitude, @Phone, @Email, @BusinessHours, @Active, @Published, @Gallery, @WhatsApp, @InstagramUrl, @SchedulingTimeOptions, @SchedulingTimeInterval, @OfereceLevaTraz, @RaioMaximoKm, @TipoTaxaDeslocamento, @TaxaDeslocamento, @CreatedAt);
                    SELECT CAST(SCOPE_IDENTITY() AS INT)";
        return await db.QuerySingleAsync<int>(sql, unidade);
    }

    public async Task UpdateAsync(Unidade unidade)
    {
        using var db = _factory.CreateConnection();
        var sql = @"UPDATE Unidades SET Name=@Name, Description=@Description, LogoUrl=@LogoUrl, Address=@Address, Number=@Number, Complement=@Complement, Neighborhood=@Neighborhood, ReferencePoint=@ReferencePoint, City=@City, State=@State, ZipCode=@ZipCode, Latitude=@Latitude, Longitude=@Longitude, Phone=@Phone, Email=@Email, BusinessHours=@BusinessHours, Active=@Active, Published=@Published, Gallery=@Gallery, WhatsApp=@WhatsApp, InstagramUrl=@InstagramUrl, SchedulingTimeOptions=@SchedulingTimeOptions, SchedulingTimeInterval=@SchedulingTimeInterval, OfereceLevaTraz=@OfereceLevaTraz, RaioMaximoKm=@RaioMaximoKm, TipoTaxaDeslocamento=@TipoTaxaDeslocamento, TaxaDeslocamento=@TaxaDeslocamento, UpdatedAt=GETUTCDATE() WHERE Id=@Id";
        await db.ExecuteAsync(sql, unidade);
    }

    public async Task DeleteAsync(int id)
    {
        using var db = _factory.CreateConnection();
        await db.ExecuteAsync("UPDATE Unidades SET Active = 0, UpdatedAt = GETUTCDATE() WHERE Id = @Id", new { Id = id });
    }

    public async Task<List<Unidade>> GetPopularAsync(int limit = 10)
    {
        using var db = _factory.CreateConnection();
        return (await db.QueryAsync<Unidade>("SELECT TOP(@Limit) * FROM Unidades WHERE Active = 1 AND Published = 1 ORDER BY AverageRating DESC, Reviews DESC", new { Limit = limit })).ToList();
    }

    public async Task<List<Unidade>> GetByLocationAsync(decimal lat, decimal lng, double radiusKm)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT *, (6371 * ACOS(COS(RADIANS(@Lat)) * COS(RADIANS(Latitude)) * COS(RADIANS(Longitude) - RADIANS(@Lng)) + SIN(RADIANS(@Lat)) * SIN(RADIANS(Latitude)))) AS Distance
                    FROM Unidades WHERE Active = 1 AND Published = 1 AND Latitude IS NOT NULL AND Longitude IS NOT NULL
                    HAVING (6371 * ACOS(COS(RADIANS(@Lat)) * COS(RADIANS(Latitude)) * COS(RADIANS(Longitude) - RADIANS(@Lng)) + SIN(RADIANS(@Lat)) * SIN(RADIANS(Latitude)))) <= @RadiusKm
                    ORDER BY Distance";
        return (await db.QueryAsync<Unidade>(sql, new { Lat = lat, Lng = lng, RadiusKm = radiusKm })).ToList();
    }
}

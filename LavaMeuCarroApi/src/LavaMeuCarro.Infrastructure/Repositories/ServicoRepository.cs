using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class ServicoRepository : IServicoRepository
{
    private readonly IDbConnectionFactory _factory;
    public ServicoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Servico?> GetByIdAsync(int id) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Servico>("SELECT * FROM Servicos WHERE Id = @Id", new { Id = id }); }
    public async Task<List<Servico>> GetByUnidadeAsync(int unidadeId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Servico>("SELECT * FROM Servicos WHERE UnidadeId = @UnidadeId AND Active = 1", new { UnidadeId = unidadeId })).ToList(); }
    public async Task<List<Servico>> GetByIdsAsync(List<int> ids) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Servico>("SELECT * FROM Servicos WHERE Id IN @Ids", new { Ids = ids })).ToList(); }
    public async Task<int> CreateAsync(Servico s) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>(@"INSERT INTO Servicos (UnidadeId, CategoryId, Name, Description, Price, DurationMinutes, Active, Icon, PrecoHatch, DuracaoHatch, PrecoSedan, DuracaoSedan, PrecoSUV, DuracaoSUV, PrecoPicape, DuracaoPicape, PrecoMoto, DuracaoMoto, IsPromotion, PromoPrice, PromoStartDate, PromoEndDate, PromoDescription, CreatedAt) VALUES (@UnidadeId, @CategoryId, @Name, @Description, @Price, @DurationMinutes, @Active, @Icon, @PrecoHatch, @DuracaoHatch, @PrecoSedan, @DuracaoSedan, @PrecoSUV, @DuracaoSUV, @PrecoPicape, @DuracaoPicape, @PrecoMoto, @DuracaoMoto, @IsPromotion, @PromoPrice, @PromoStartDate, @PromoEndDate, @PromoDescription, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", s); }
    public async Task UpdateAsync(Servico s) { using var db = _factory.CreateConnection(); await db.ExecuteAsync(@"UPDATE Servicos SET Name=@Name, Description=@Description, Price=@Price, DurationMinutes=@DurationMinutes, Active=@Active, Icon=@Icon, PrecoHatch=@PrecoHatch, DuracaoHatch=@DuracaoHatch, PrecoSedan=@PrecoSedan, DuracaoSedan=@DuracaoSedan, PrecoSUV=@PrecoSUV, DuracaoSUV=@DuracaoSUV, PrecoPicape=@PrecoPicape, DuracaoPicape=@DuracaoPicape, PrecoMoto=@PrecoMoto, DuracaoMoto=@DuracaoMoto, IsPromotion=@IsPromotion, PromoPrice=@PromoPrice, PromoStartDate=@PromoStartDate, PromoEndDate=@PromoEndDate, PromoDescription=@PromoDescription WHERE Id=@Id", s); }
    public async Task DeleteAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Servicos SET Active = 0 WHERE Id = @Id", new { Id = id }); }
}

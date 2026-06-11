using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class FuncionarioRepository : IFuncionarioRepository
{
    private readonly IDbConnectionFactory _factory;
    public FuncionarioRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Funcionario?> GetByIdAsync(int id) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Funcionario>("SELECT * FROM Funcionarios WHERE Id = @Id", new { Id = id }); }
    public async Task<List<Funcionario>> GetByUnidadeAsync(int unidadeId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Funcionario>("SELECT * FROM Funcionarios WHERE UnidadeId = @UnidadeId AND Active = 1", new { UnidadeId = unidadeId })).ToList(); }
    public async Task<List<Funcionario>> GetByIdsAsync(List<int> ids) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Funcionario>("SELECT * FROM Funcionarios WHERE Id IN @Ids", new { Ids = ids })).ToList(); }
    public async Task<int> CreateAsync(Funcionario f) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Funcionarios (UserId, UnidadeId, Specialty, Bio, AvailableTimes, IsAdmin, Active, CreatedAt) VALUES (@UserId, @UnidadeId, @Specialty, @Bio, @AvailableTimes, @IsAdmin, @Active, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", f); }
    public async Task UpdateAsync(Funcionario f) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Funcionarios SET Specialty=@Specialty, Bio=@Bio, Active=@Active, AvailableTimes=@AvailableTimes, IsAdmin=@IsAdmin WHERE Id=@Id", f); }
    public async Task DeleteAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Funcionarios SET Active = 0 WHERE Id = @Id", new { Id = id }); }
    public async Task<Funcionario?> GetByUserIdAndUnidadeAsync(int userId, int unidadeId) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Funcionario>("SELECT * FROM Funcionarios WHERE UserId = @UserId AND UnidadeId = @UnidadeId AND Active = 1", new { UserId = userId, UnidadeId = unidadeId }); }
    public async Task<List<(Funcionario Funcionario, string UserName, string UnidadeName)>> GetPopularAsync(int limit = 10)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT TOP(@Limit) f.*, u.Name AS UserName, un.Name AS UnidadeName
                    FROM Funcionarios f
                    INNER JOIN Users u ON u.Id = f.UserId
                    INNER JOIN Unidades un ON un.Id = f.UnidadeId
                    WHERE f.Active = 1 AND un.Active = 1 AND un.Published = 1
                    ORDER BY f.AverageRating DESC, f.TotalReviews DESC";
        var rows = await db.QueryAsync<Funcionario, string, string, (Funcionario, string, string)>(
            sql,
            (f, userName, unidadeName) => (f, userName, unidadeName),
            new { Limit = limit },
            splitOn: "UserName,UnidadeName");
        return rows.ToList();
    }
}

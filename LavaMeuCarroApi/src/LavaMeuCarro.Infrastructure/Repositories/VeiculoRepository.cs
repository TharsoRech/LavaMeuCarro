using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class VeiculoRepository : IVeiculoRepository
{
    private readonly IDbConnectionFactory _factory;
    public VeiculoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Veiculo?> GetByIdAsync(int id) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Veiculo>("SELECT * FROM Veiculos WHERE Id = @Id", new { Id = id }); }
    public async Task<List<Veiculo>> GetByClientAsync(int clientId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Veiculo>("SELECT * FROM Veiculos WHERE ClientId = @ClientId", new { ClientId = clientId })).ToList(); }
    public async Task<Veiculo?> GetByPlacaAsync(string placa) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Veiculo>("SELECT * FROM Veiculos WHERE Placa = @Placa", new { Placa = placa }); }
    public async Task<int> CreateAsync(Veiculo v) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Veiculos (ClientId, Placa, Marca, Modelo, Cor, Tamanho, CreatedAt) VALUES (@ClientId, @Placa, @Marca, @Modelo, @Cor, @Tamanho, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", v); }
    public async Task UpdateAsync(Veiculo v) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Veiculos SET Placa=@Placa, Marca=@Marca, Modelo=@Modelo, Cor=@Cor, Tamanho=@Tamanho WHERE Id=@Id", v); }
    public async Task DeleteAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("DELETE FROM Veiculos WHERE Id = @Id", new { Id = id }); }
}

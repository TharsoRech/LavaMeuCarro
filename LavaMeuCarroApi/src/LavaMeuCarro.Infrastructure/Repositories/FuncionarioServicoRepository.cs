using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class FuncionarioServicoRepository : IFuncionarioServicoRepository
{
    private readonly IDbConnectionFactory _factory;
    public FuncionarioServicoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<int>> GetServicoIdsByFuncionarioAsync(int funcionarioId)
    {
        using var db = _factory.CreateConnection();
        var result = await db.QueryAsync<int>(
            "SELECT ServicoId FROM FuncionarioServicos WHERE FuncionarioId = @FuncionarioId",
            new { FuncionarioId = funcionarioId });
        return result.ToList();
    }

    public async Task SetServicosAsync(int funcionarioId, List<int> servicoIds)
    {
        using var db = _factory.CreateConnection();
        
        // Remove todos os serviços atuais
        await db.ExecuteAsync(
            "DELETE FROM FuncionarioServicos WHERE FuncionarioId = @FuncionarioId",
            new { FuncionarioId = funcionarioId });
        
        // Insere os novos serviços
        if (servicoIds != null && servicoIds.Count > 0)
        {
            foreach (var servicoId in servicoIds.Distinct())
            {
                await db.ExecuteAsync(
                    "INSERT INTO FuncionarioServicos (FuncionarioId, ServicoId) VALUES (@FuncionarioId, @ServicoId)",
                    new { FuncionarioId = funcionarioId, ServicoId = servicoId });
            }
        }
    }

    public async Task<List<int>> GetFuncionarioIdsByServicoAsync(int servicoId)
    {
        using var db = _factory.CreateConnection();
        var result = await db.QueryAsync<int>(
            "SELECT FuncionarioId FROM FuncionarioServicos WHERE ServicoId = @ServicoId",
            new { ServicoId = servicoId });
        return result.ToList();
    }
}

using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.Application.Interfaces;

public interface IVeiculoRepository
{
    Task<Veiculo?> GetByIdAsync(int id);
    Task<List<Veiculo>> GetByClientAsync(int clientId);
    Task<Veiculo?> GetByPlacaAsync(string placa);
    Task<int> CreateAsync(Veiculo veiculo);
    Task UpdateAsync(Veiculo veiculo);
    Task DeleteAsync(int id);
    Task<List<Veiculo>> GetByIdsAsync(List<int> ids);
    Task<List<Veiculo>> GetByUnidadeAsync(int unidadeId);
    Task<Veiculo?> GetByIdWithClientAsync(int id);
}

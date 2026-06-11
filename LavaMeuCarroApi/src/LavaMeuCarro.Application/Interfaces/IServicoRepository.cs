using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.Application.Interfaces;

public interface IServicoRepository
{
    Task<Servico?> GetByIdAsync(int id);
    Task<List<Servico>> GetByUnidadeAsync(int unidadeId);
    Task<List<Servico>> GetByIdsAsync(List<int> ids);
    Task<List<Servico>> GetPromotionsAsync(int limit = 10);
    Task<int> CreateAsync(Servico servico);
    Task UpdateAsync(Servico servico);
    Task DeleteAsync(int id);
}

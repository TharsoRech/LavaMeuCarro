using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.Application.Interfaces;

public interface IFuncionarioRepository
{
    Task<Funcionario?> GetByIdAsync(int id);
    Task<List<Funcionario>> GetByUnidadeAsync(int unidadeId);
    Task<List<Funcionario>> GetByIdsAsync(List<int> ids);
    Task<int> CreateAsync(Funcionario funcionario);
    Task UpdateAsync(Funcionario funcionario);
    Task DeleteAsync(int id);
    Task<Funcionario?> GetByUserIdAndUnidadeAsync(int userId, int unidadeId);
    Task<List<(Funcionario Funcionario, string UserName, string UnidadeName)>> GetPopularAsync(int limit = 10);
}

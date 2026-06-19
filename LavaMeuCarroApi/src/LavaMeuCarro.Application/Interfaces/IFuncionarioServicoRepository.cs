using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.Application.Interfaces;

public interface IFuncionarioServicoRepository
{
    Task<List<int>> GetServicoIdsByFuncionarioAsync(int funcionarioId);
    Task SetServicosAsync(int funcionarioId, List<int> servicoIds);
    Task<List<int>> GetFuncionarioIdsByServicoAsync(int servicoId);
}

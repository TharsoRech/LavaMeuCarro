using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.Application.Interfaces;

public interface IUnidadeRepository
{
    Task<Unidade?> GetByIdAsync(int id);
    Task<List<Unidade>> GetAllAsync(string? city, string? search);
    Task<(List<Unidade> Items, int Total)> GetPagedAsync(int page, int pageSize, string? city, string? search);
    Task<List<Unidade>> GetByOwnerAsync(int ownerId);
    Task<int> CreateAsync(Unidade unidade);
    Task UpdateAsync(Unidade unidade);
    Task DeleteAsync(int id);
    Task<List<Unidade>> GetPopularAsync(int limit = 10);
    Task<List<Unidade>> GetByLocationAsync(decimal lat, decimal lng, double radiusKm);
    Task<List<Unidade>> GetByIdsAsync(List<int> ids);
}

using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<int> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(int id);
    Task<List<User>> GetAllAsync(int page, int pageSize, string? search);
    Task<int> CountAsync(string? search);
    Task<List<User>> GetByIdsAsync(List<int> ids);
}

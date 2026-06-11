using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _factory;
    public UserRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<User?> GetByIdAsync(int id)
    {
        using var db = _factory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<User>("SELECT * FROM Users WHERE Id = @Id", new { Id = id });
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var db = _factory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<User>("SELECT * FROM Users WHERE Email = @Email", new { Email = email });
    }

    public async Task<int> CreateAsync(User user)
    {
        using var db = _factory.CreateConnection();
        var sql = @"INSERT INTO Users (Name, Email, PasswordHash, Phone, Base64Image, Doc, Dob, Username, Country, Type, Active, CreatedAt)
                    VALUES (@Name, @Email, @PasswordHash, @Phone, @Base64Image, @Doc, @Dob, @Username, @Country, @Type, @Active, @CreatedAt);
                    SELECT CAST(SCOPE_IDENTITY() AS INT)";
        return await db.QuerySingleAsync<int>(sql, user);
    }

    public async Task UpdateAsync(User user)
    {
        using var db = _factory.CreateConnection();
        var sql = @"UPDATE Users SET Name=@Name, Email=@Email, PasswordHash=@PasswordHash, Phone=@Phone,
                    Base64Image=@Base64Image, Doc=@Doc, Dob=@Dob, Username=@Username, Country=@Country,
                    Type=@Type, Active=@Active, UpdatedAt=@UpdatedAt WHERE Id=@Id";
        await db.ExecuteAsync(sql, user);
    }

    public async Task DeleteAsync(int id)
    {
        using var db = _factory.CreateConnection();
        await db.ExecuteAsync("UPDATE Users SET Active = 0, UpdatedAt = GETUTCDATE() WHERE Id = @Id", new { Id = id });
    }

    public async Task<List<User>> GetAllAsync(int page, int pageSize, string? search)
    {
        using var db = _factory.CreateConnection();
        var sql = "SELECT * FROM Users WHERE (@Search IS NULL OR Name LIKE @Search OR Email LIKE @Search) ORDER BY Id DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
        return (await db.QueryAsync<User>(sql, new { Search = search != null ? $"%{search}%" : null, Offset = (page - 1) * pageSize, PageSize = pageSize })).ToList();
    }

    public async Task<int> CountAsync(string? search)
    {
        using var db = _factory.CreateConnection();
        return await db.QuerySingleAsync<int>("SELECT COUNT(*) FROM Users WHERE (@Search IS NULL OR Name LIKE @Search OR Email LIKE @Search)", new { Search = search != null ? $"%{search}%" : null });
    }

    public async Task<List<User>> GetByIdsAsync(List<int> ids)
    {
        if (ids.Count == 0) return new List<User>();
        using var db = _factory.CreateConnection();
        return (await db.QueryAsync<User>("SELECT * FROM Users WHERE Id IN @Ids", new { Ids = ids })).ToList();
    }
}

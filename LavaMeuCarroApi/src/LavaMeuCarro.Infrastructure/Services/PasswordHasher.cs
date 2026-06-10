using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.Infrastructure.Services;

public class BcryptPasswordHasher : IPasswordHasher
{
    public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    public bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}

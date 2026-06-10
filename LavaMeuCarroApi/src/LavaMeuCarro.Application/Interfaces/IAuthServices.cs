using LavaMeuCarro.Domain.Entities;

namespace LavaMeuCarro.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
    string GenerateRefreshToken();
    (int UserId, string Role)? ValidateToken(string token);
}

public interface IRefreshTokenRepository
{
    Task<int> CreateAsync(RefreshToken refreshToken);
    Task<RefreshToken?> GetByHashAsync(string hash);
    Task RevokeAsync(int id);
    Task RevokeAllByUserAsync(int userId);
}

public interface IEmailVerificationTokenRepository
{
    Task<int> CreateAsync(EmailVerificationToken token);
    Task<EmailVerificationToken?> GetByCodeAsync(string email, string code);
    Task MarkUsedAsync(int id);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool Verify(string password, string hash);
}

public interface IEmailService
{
    Task SendVerificationEmailAsync(string email, string code);
    Task SendPasswordResetEmailAsync(string email, string code);
    Task SendAppointmentEmailAsync(string email, string subject, string body);
}

using MediatR;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;
using LavaMeuCarro.Domain.Exceptions;
using System.Security.Cryptography;

namespace LavaMeuCarro.Application.Commands.Auth;

public class LoginHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IRefreshTokenRepository _refreshRepo;

    public LoginHandler(IUserRepository users, IPasswordHasher hasher, IJwtTokenService jwt, IRefreshTokenRepository refreshRepo)
    {
        _users = users; _hasher = hasher; _jwt = jwt; _refreshRepo = refreshRepo;
    }

    public async Task<LoginResponse> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await _users.GetByEmailAsync(cmd.Request.Email)
            ?? throw new BusinessException("Invalid credentials", 401);

        if (!user.Active) throw new BusinessException("Account is deactivated", 403);
        if (!_hasher.Verify(cmd.Request.Password, user.PasswordHash))
            throw new BusinessException("Invalid credentials", 401);

        var token = _jwt.GenerateToken(user);
        var refreshTokenStr = _jwt.GenerateRefreshToken();
        var hash = Convert.ToBase64String(SHA256.Create().ComputeHash(System.Text.Encoding.UTF8.GetBytes(refreshTokenStr)));

        await _refreshRepo.CreateAsync(new RefreshToken
        {
            UserId = user.Id, TokenHash = hash, ExpiresAt = DateTime.UtcNow.AddDays(30)
        });

        return new LoginResponse(token, refreshTokenStr, MapUser(user));
    }

    private static UserDTO MapUser(User u) => new(u.Id, u.Name, u.Email, u.Phone, u.Base64Image, u.Doc, u.Dob, u.Username, u.Country, u.Type, u.Active, u.CreatedAt);
}

public class RegisterHandler : IRequestHandler<RegisterCommand, LoginResponse>
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IRefreshTokenRepository _refreshRepo;

    public RegisterHandler(IUserRepository users, IPasswordHasher hasher, IJwtTokenService jwt, IRefreshTokenRepository refreshRepo)
    {
        _users = users; _hasher = hasher; _jwt = jwt; _refreshRepo = refreshRepo;
    }

    public async Task<LoginResponse> Handle(RegisterCommand cmd, CancellationToken ct)
    {
        var existing = await _users.GetByEmailAsync(cmd.Request.Email);
        if (existing != null) throw new ConflictException("Email already registered");

        var user = new User
        {
            Name = cmd.Request.Name, Email = cmd.Request.Email,
            PasswordHash = _hasher.HashPassword(cmd.Request.Password),
            Phone = cmd.Request.Phone, Type = cmd.Request.Type,
            Doc = cmd.Request.Doc, Dob = cmd.Request.Dob
        };

        user.Id = await _users.CreateAsync(user);
        var token = _jwt.GenerateToken(user);
        var refreshTokenStr = _jwt.GenerateRefreshToken();
        var hash = Convert.ToBase64String(SHA256.Create().ComputeHash(System.Text.Encoding.UTF8.GetBytes(refreshTokenStr)));

        await _refreshRepo.CreateAsync(new RefreshToken
        {
            UserId = user.Id, TokenHash = hash, ExpiresAt = DateTime.UtcNow.AddDays(30)
        });

        return new LoginResponse(token, refreshTokenStr,
            new UserDTO(user.Id, user.Name, user.Email, user.Phone, user.Base64Image, user.Doc, user.Dob, user.Username, user.Country, user.Type, user.Active, user.CreatedAt));
    }
}

public class RefreshHandler : IRequestHandler<RefreshCommand, RefreshResponse>
{
    private readonly IRefreshTokenRepository _refreshRepo;
    private readonly IUserRepository _users;
    private readonly IJwtTokenService _jwt;

    public RefreshHandler(IRefreshTokenRepository refreshRepo, IUserRepository users, IJwtTokenService jwt)
    {
        _refreshRepo = refreshRepo; _users = users; _jwt = jwt;
    }

    public async Task<RefreshResponse> Handle(RefreshCommand cmd, CancellationToken ct)
    {
        var hash = Convert.ToBase64String(SHA256.Create().ComputeHash(System.Text.Encoding.UTF8.GetBytes(cmd.Request.RefreshToken)));
        var stored = await _refreshRepo.GetByHashAsync(hash)
            ?? throw new BusinessException("Invalid refresh token", 401);

        if (stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
            throw new BusinessException("Refresh token expired or revoked", 401);

        var user = await _users.GetByIdAsync(stored.UserId)
            ?? throw new BusinessException("User not found", 401);

        await _refreshRepo.RevokeAsync(stored.Id);

        var newToken = _jwt.GenerateToken(user);
        var newRefreshStr = _jwt.GenerateRefreshToken();
        var newHash = Convert.ToBase64String(SHA256.Create().ComputeHash(System.Text.Encoding.UTF8.GetBytes(newRefreshStr)));

        await _refreshRepo.CreateAsync(new RefreshToken
        {
            UserId = user.Id, TokenHash = newHash, ExpiresAt = DateTime.UtcNow.AddDays(30)
        });

        return new RefreshResponse(newToken, newRefreshStr);
    }
}

public class LogoutHandler : IRequestHandler<LogoutCommand, Unit>
{
    private readonly IRefreshTokenRepository _refreshRepo;
    public LogoutHandler(IRefreshTokenRepository refreshRepo) => _refreshRepo = refreshRepo;

    public async Task<Unit> Handle(LogoutCommand cmd, CancellationToken ct)
    {
        await _refreshRepo.RevokeAllByUserAsync(cmd.UserId);
        return Unit.Value;
    }
}

public class ChangePasswordHandler : IRequestHandler<ChangePasswordCommand, Unit>
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _hasher;

    public ChangePasswordHandler(IUserRepository users, IPasswordHasher hasher)
    {
        _users = users; _hasher = hasher;
    }

    public async Task<Unit> Handle(RefreshCommand cmd, CancellationToken ct) => Unit.Value;

    public async Task<Unit> Handle(ChangePasswordCommand cmd, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(cmd.UserId)
            ?? throw new NotFoundException("User not found");

        if (!_hasher.Verify(cmd.Request.CurrentPassword, user.PasswordHash))
            throw new BusinessException("Current password is incorrect");

        user.PasswordHash = _hasher.HashPassword(cmd.Request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);
        return Unit.Value;
    }
}

public class UpdateProfileHandler : IRequestHandler<UpdateProfileCommand, UserDTO>
{
    private readonly IUserRepository _users;
    public UpdateProfileHandler(IUserRepository users) => _users = users;

    public async Task<UserDTO> Handle(UpdateProfileCommand cmd, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(cmd.UserId)
            ?? throw new NotFoundException("User not found");

        if (cmd.Name != null) user.Name = cmd.Name;
        if (cmd.Phone != null) user.Phone = cmd.Phone;
        if (cmd.Base64Image != null) user.Base64Image = cmd.Base64Image;
        if (cmd.Doc != null) user.Doc = cmd.Doc;
        if (cmd.Dob != null) user.Dob = cmd.Dob;
        if (cmd.Username != null) user.Username = cmd.Username;
        if (cmd.Country != null) user.Country = cmd.Country;
        if (cmd.Type != null) user.Type = (UserType)cmd.Type.Value;
        user.UpdatedAt = DateTime.UtcNow;

        await _users.UpdateAsync(user);
        return new UserDTO(user.Id, user.Name, user.Email, user.Phone, user.Base64Image, user.Doc, user.Dob, user.Username, user.Country, user.Type, user.Active, user.CreatedAt);
    }
}

public class DeleteUserHandler : IRequestHandler<DeleteUserCommand, Unit>
{
    private readonly IUserRepository _users;
    public DeleteUserHandler(IUserRepository users) => _users = users;

    public async Task<Unit> Handle(DeleteUserCommand cmd, CancellationToken ct)
    {
        if (cmd.UserId != cmd.RequesterId)
            throw new ForbiddenException("Can only delete own account");

        var user = await _users.GetByIdAsync(cmd.UserId)
            ?? throw new NotFoundException("User not found");

        user.Active = false;
        await _users.UpdateAsync(user);
        return Unit.Value;
    }
}

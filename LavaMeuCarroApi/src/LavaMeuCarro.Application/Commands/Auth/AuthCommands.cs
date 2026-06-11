using MediatR;
using LavaMeuCarro.Application.DTOs;

namespace LavaMeuCarro.Application.Commands.Auth;

public record LoginCommand(LoginRequest Request) : IRequest<LoginResponse>;
public record RegisterCommand(RegisterRequest Request) : IRequest<LoginResponse>;
public record RefreshCommand(RefreshRequest Request) : IRequest<RefreshResponse>;
public record ForgotPasswordCommand(ForgotPasswordRequest Request) : IRequest<Unit>;
public record ResetPasswordCommand(ResetPasswordRequest Request) : IRequest<Unit>;
public record LogoutCommand(int UserId) : IRequest<Unit>;
public record VerifyEmailCommand(VerifyEmailRequest Request) : IRequest<Unit>;
public record ChangePasswordCommand(int UserId, ChangePasswordRequest Request) : IRequest<Unit>;
public record UpdateProfileCommand(int UserId, string? Name, string? Phone, string? Base64Image, string? Doc, DateTime? Dob, string? Username, string? Country, int? Type) : IRequest<UserDTO>;
public record DeleteUserCommand(int UserId, int RequesterId) : IRequest<Unit>;

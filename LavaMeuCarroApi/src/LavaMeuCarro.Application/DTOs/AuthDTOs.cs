using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Application.DTOs;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, string RefreshToken, UserDTO User);
public record RegisterRequest(string Name, string Email, string Password, string? Phone, UserType Type, string? Doc, DateTime? Dob, List<ConsentItem>? Consents);
public record ConsentItem(string Code, string Version);
public record RefreshRequest(string RefreshToken);
public record RefreshResponse(string Token, string RefreshToken);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);
public record VerifyEmailRequest(string Email, string Code);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record UserDTO(
    int Id, string Name, string Email, string? Phone, string? Base64Image,
    string? Doc, DateTime? Dob, string? Username, string? Country,
    UserType Type, bool Active, DateTime CreatedAt
);

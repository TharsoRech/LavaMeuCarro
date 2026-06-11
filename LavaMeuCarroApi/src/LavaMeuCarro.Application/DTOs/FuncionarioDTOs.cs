namespace LavaMeuCarro.Application.DTOs;

public record FuncionarioDTO(int Id, int UserId, int UnidadeId, string? Specialty, string? Bio, decimal? AverageRating, int TotalReviews, bool Active, string? AvailableTimes, bool IsAdmin, string? UserName, string? UserPhone);
public record PopularProfessionalDTO(int Id, int UserId, int UnidadeId, string Name, string UnidadeName, string? Specialty, decimal? AverageRating, int TotalReviews);
public record CreateFuncionarioRequest(int UserId, string? Specialty, string? Bio, string? AvailableTimes, bool IsAdmin);
public record CreateFuncionarioByDocRequest(string Doc, string? Specialty, string? Bio, string? AvailableTimes, bool IsAdmin);
public record UpdateFuncionarioRequest(string? Specialty, string? Bio, bool? Active, string? AvailableTimes, bool? IsAdmin);

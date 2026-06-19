using System.Text.Json;

namespace LavaMeuCarro.Application.DTOs;

public record FuncionarioDTO(int Id, int UserId, int UnidadeId, string? Specialty, string? Bio, decimal? AverageRating, int TotalReviews, bool Active, string? AvailableTimes, bool IsAdmin, string? Name, string? Phone, string? PhotoUrl, Dictionary<string, string[]>? Schedule, string? Doc, List<int>? ServiceIds);
public record PopularProfessionalDTO(int Id, int UserId, int UnidadeId, string Name, string UnidadeName, string? Specialty, decimal? AverageRating, int TotalReviews);
public record CreateFuncionarioRequest(int UserId, string? Specialty, string? Bio, string? AvailableTimes, bool IsAdmin);
public record CreateFuncionarioByDocRequest(string Doc, int UnidadeId, string? Name, string? Specialty, string? Bio, string? AvailableTimes, bool IsAdmin, string? Base64Image, List<int>? ServiceIds);
public record UpdateFuncionarioRequest(string? Name, string? Specialty, string? Bio, bool? Active, string? AvailableTimes, bool? IsAdmin, string? Base64Image, List<int>? ServiceIds);

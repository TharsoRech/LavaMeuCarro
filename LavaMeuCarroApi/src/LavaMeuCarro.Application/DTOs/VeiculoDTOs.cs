namespace LavaMeuCarro.Application.DTOs;

public record VeiculoDTO(int Id, int ClientId, string Placa, string Marca, string Modelo, string? Cor, string Tamanho, int? Ano, string? FotoBase64, DateTime CreatedAt);
public record VeiculoAdminDTO(int Id, int ClientId, string Placa, string Marca, string Modelo, string? Cor, string Tamanho, int? Ano, string? FotoBase64, DateTime CreatedAt, string? ClientName, string? ClientPhone);
public record CreateVeiculoRequest(string Placa, string Marca, string Modelo, string? Cor, string Tamanho, int? Ano, string? FotoBase64);
public record UpdateVeiculoRequest(string? Placa, string? Marca, string? Modelo, string? Cor, string? Tamanho, int? Ano, string? FotoBase64);
public record VehicleAppointmentDTO(int Id, DateTime ScheduledAt, string Status, string? ServiceName, string? ProfessionalName, decimal TotalPrice, int DurationMinutes);

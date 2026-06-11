namespace LavaMeuCarro.Application.DTOs;

public record VeiculoDTO(int Id, int ClientId, string Placa, string Marca, string Modelo, string? Cor, string Tamanho, int? Ano, string? FotoBase64, DateTime CreatedAt);
public record CreateVeiculoRequest(string Placa, string Marca, string Modelo, string? Cor, string Tamanho, int? Ano, string? FotoBase64);
public record UpdateVeiculoRequest(string? Placa, string? Marca, string? Modelo, string? Cor, string? Tamanho, int? Ano, string? FotoBase64);

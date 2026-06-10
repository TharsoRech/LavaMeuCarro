using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Application.DTOs;

public record AgendamentoDTO(
    int Id, int ClientId, int FuncionarioId, int ServicoId, int UnidadeId,
    int VeiculoId, DateTime ScheduledAt, int DurationMinutes, decimal TotalPrice,
    AgendamentoStatus Status, string Modalidade, decimal? TaxaDeslocamento,
    decimal PrecoBruto, decimal? Desconto, decimal? PrecoAdicionais,
    string? Notes, string? CancellationReason, DateTime CreatedAt,
    string? VistoriaFotos, string? VistoriaObservacoes, DateTime? VistoriaData,
    string? RetiradoPor, string? NomeAutorizado, string? DocumentoAutorizado,
    DateTime? RetiradaEm,
    string? ClientName, string? ClientPhone,
    string? FuncionarioName, string? ServicoName,
    string? UnidadeName, string? VeiculoPlaca, string? VeiculoModelo
);

public record CreateAgendamentoRequest(
    int FuncionarioId, int ServicoId, int UnidadeId, int VeiculoId,
    DateTime ScheduledAt, string Modalidade, string? Notes,
    List<int>? AdicionaisIds
);

public record CreateManualAgendamentoRequest(
    int ClientId, int FuncionarioId, int ServicoId, int UnidadeId,
    int VeiculoId, DateTime ScheduledAt, string Modalidade, string? Notes,
    List<int>? AdicionaisIds
);

public record UpdateStatusRequest(AgendamentoStatus Status, string? CancellationReason);
public record VistoriaRequest(List<string> Fotos, string? Observacoes);
public record RetiradaRequest(string RetiradoPor, string? NomeAutorizado, string? DocumentoAutorizado);
public record AutorizadoRequest(string NomeCompleto, string Documento, string? Telefone);
public record AutorizadoDTO(string NomeCompleto, string Documento, string? Telefone, DateTime AutorizadoEm);

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
    string? ClientName, string? ClientPhone, string? ClientCity, string? ClientImage,
    string? FuncionarioName, string? FuncionarioImage,
    string? ServicoName,
    string? UnidadeName, string? UnidadeLogoUrl, string? UnidadeWhatsApp, string? UnidadeAddress,
    string? VeiculoPlaca, string? VeiculoModelo
);

// Client appointment history DTOs
public record ClientAppointmentHistoryDTO(
    List<ClientAppointmentHistoryItemDTO> AtThisSalon
);

public record ClientAppointmentHistoryItemDTO(
    int Id, string? ScheduledAt, string Status, string? ServiceName,
    string? ProfessionalName, string? SalonName, int DurationMinutes,
    decimal TotalPrice, string? CancellationReason, string? Notes
);

// Professional reassignment option DTO
public record ProfessionalOptionDTO(
    int ProfessionalId, string ProfessionalName, string? ProfessionalImage
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
public record ReassignProfessionalRequest(int NovoFuncionarioId);

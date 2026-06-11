namespace LavaMeuCarro.Application.DTOs;

public record NotificacaoDTO(int Id, int UserId, string Title, string Body, string Type, bool IsRead, string? ReferenceId, string? ReferenceType, DateTime CreatedAt);
public record CategoriaDTO(int Id, string Name, string? IconUrl, bool Active);
public record AvaliacaoDTO(int Id, int AgendamentoId, int ClientId, int? FuncionarioId, int UnidadeId, string TargetType, int Rating, string? Comment, string? Fotos, DateTime CreatedAt, string? ClientName);
public record CreateAvaliacaoRequest(int AgendamentoId, int? FuncionarioId, int UnidadeId, string TargetType, int Rating, string? Comment, List<string>? Fotos);
public record NpsShouldShowDTO(bool ShouldShow);
public record NpsSubmitRequest(int Score, string? Comment);
public record LegalDocumentDTO(int Id, string Code, string Title, string Version, string Context, string Content, bool IsRequired);
public record SuporteRequest(string Assunto, string Mensagem);
public record DashboardSummaryDTO(int TotalToday, int Confirmados, int Pendentes, int FinalizadosMes, decimal FaturamentoMes, int FinalizadosHoje, decimal FaturamentoHoje);
public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);
public record MasterStatsDTO(int TotalUsers, int TotalUnidades, int TotalAgendamentos, int TotalAssinaturasAtivas, int NoShowCount);
public record TelemetriaDTO(DateTime ServerTime);

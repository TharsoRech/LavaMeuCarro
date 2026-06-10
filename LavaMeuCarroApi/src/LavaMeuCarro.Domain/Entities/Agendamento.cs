using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Domain.Entities;

public class Agendamento
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int FuncionarioId { get; set; }
    public int ServicoId { get; set; }
    public int UnidadeId { get; set; }
    public int VeiculoId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; }
    public decimal TotalPrice { get; set; }
    public AgendamentoStatus Status { get; set; } = AgendamentoStatus.Pendente;
    public string Modalidade { get; set; } = "LevarAoLocal";
    public decimal? TaxaDeslocamento { get; set; }
    public decimal PrecoBruto { get; set; }
    public decimal? Desconto { get; set; }
    public decimal? PrecoAdicionais { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? VistoriaFotos { get; set; }
    public string? VistoriaObservacoes { get; set; }
    public DateTime? VistoriaData { get; set; }
    public string? RetiradoPor { get; set; }
    public string? NomeAutorizado { get; set; }
    public string? DocumentoAutorizado { get; set; }
    public DateTime? RetiradaEm { get; set; }
}

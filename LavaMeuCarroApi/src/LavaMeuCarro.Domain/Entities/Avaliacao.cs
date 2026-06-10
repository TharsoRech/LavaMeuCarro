using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Domain.Entities;

public class Avaliacao
{
    public int Id { get; set; }
    public int AgendamentoId { get; set; }
    public int ClientId { get; set; }
    public int? FuncionarioId { get; set; }
    public int UnidadeId { get; set; }
    public ReviewTarget TargetType { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string? Fotos { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

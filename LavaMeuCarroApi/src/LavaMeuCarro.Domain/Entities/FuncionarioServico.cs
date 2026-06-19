namespace LavaMeuCarro.Domain.Entities;

public class FuncionarioServico
{
    public int Id { get; set; }
    public int FuncionarioId { get; set; }
    public int ServicoId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

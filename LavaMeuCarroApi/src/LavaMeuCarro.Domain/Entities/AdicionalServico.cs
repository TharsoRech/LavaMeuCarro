namespace LavaMeuCarro.Domain.Entities;

public class AdicionalServico
{
    public int Id { get; set; }
    public int UnidadeId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public decimal Preco { get; set; }
    public bool Active { get; set; } = true;
}

namespace LavaMeuCarro.Domain.Entities;

public class Veiculo
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public string Placa { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string? Cor { get; set; }
    public string Tamanho { get; set; } = "Hatch";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

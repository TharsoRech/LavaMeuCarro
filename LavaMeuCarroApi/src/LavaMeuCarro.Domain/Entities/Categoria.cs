namespace LavaMeuCarro.Domain.Entities;

public class Categoria
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public bool Active { get; set; } = true;
}

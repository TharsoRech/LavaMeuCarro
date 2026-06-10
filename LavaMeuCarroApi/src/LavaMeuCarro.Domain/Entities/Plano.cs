namespace LavaMeuCarro.Domain.Entities;

public class Plano
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int PeriodDays { get; set; } = 30;
    public int? AppointmentLimit { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

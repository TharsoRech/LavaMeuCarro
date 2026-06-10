namespace LavaMeuCarro.Domain.Entities;

public class Funcionario
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int UnidadeId { get; set; }
    public string? Specialty { get; set; }
    public string? Bio { get; set; }
    public decimal? AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? AvailableTimes { get; set; }
    public bool IsAdmin { get; set; } = false;
}

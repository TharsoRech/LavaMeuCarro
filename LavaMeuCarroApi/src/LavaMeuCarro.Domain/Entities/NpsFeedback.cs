namespace LavaMeuCarro.Domain.Entities;

public class NpsFeedback
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

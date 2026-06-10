namespace LavaMeuCarro.Domain.Entities;

public class SubscriptionCancellationAttempt
{
    public int Id { get; set; }
    public int AssinaturaId { get; set; }
    public string? Reason { get; set; }
    public bool Cancelled { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

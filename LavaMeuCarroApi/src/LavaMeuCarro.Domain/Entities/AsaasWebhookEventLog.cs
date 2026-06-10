namespace LavaMeuCarro.Domain.Entities;

public class AsaasWebhookEventLog
{
    public int Id { get; set; }
    public string? EventType { get; set; }
    public string? Payload { get; set; }
    public string? AsaasPaymentId { get; set; }
    public bool Processed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

namespace LavaMeuCarro.Domain.Entities;

public class AsaasCheckoutLock
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public string? CheckoutUrl { get; set; }
    public string? CheckoutId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}

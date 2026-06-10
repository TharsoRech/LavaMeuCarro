namespace LavaMeuCarro.Domain.Entities;

public class PushDeviceToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string DeviceToken { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? Platform { get; set; }
    public string? DeviceId { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

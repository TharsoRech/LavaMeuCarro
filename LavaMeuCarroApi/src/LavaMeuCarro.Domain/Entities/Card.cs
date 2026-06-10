namespace LavaMeuCarro.Domain.Entities;

public class Card
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? AsaasCardId { get; set; }
    public string? LastFourDigits { get; set; }
    public string? Brand { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

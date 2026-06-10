namespace LavaMeuCarro.Domain.Entities;

public class UserAcceptance
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string DocumentCode { get; set; } = string.Empty;
    public string DocumentVersion { get; set; } = string.Empty;
    public string ConsentContext { get; set; } = string.Empty;
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

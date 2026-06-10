namespace LavaMeuCarro.Domain.Entities;

public class LegalDocument
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Context { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRequired { get; set; } = true;
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

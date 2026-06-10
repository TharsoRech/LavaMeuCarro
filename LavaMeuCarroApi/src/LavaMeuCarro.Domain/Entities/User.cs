using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Base64Image { get; set; }
    public string? Doc { get; set; }
    public DateTime? Dob { get; set; }
    public string? Username { get; set; }
    public string? Country { get; set; }
    public UserType Type { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

namespace HoraDaBeleza.Domain.Entities;

public class Review
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int ClientId { get; set; }
    public int ProfessionalId { get; set; }
    public int SalonId { get; set; }
    public HoraDaBeleza.Domain.Enums.ReviewTarget? TargetType { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

namespace LavaMeuCarro.Domain.Entities;

public class Review
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int ClientId { get; set; }
    public int FuncionarioId { get; set; }  // Changed from ProfessionalId
    public int UnidadeId { get; set; }  // Changed from SalonId
    // TargetType removed - reviews are for both unit and professional in LavaMeuCarro
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

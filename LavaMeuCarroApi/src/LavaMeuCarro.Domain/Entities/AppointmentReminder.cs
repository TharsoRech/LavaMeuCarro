namespace LavaMeuCarro.Domain.Entities;

public class AppointmentReminder
{
    public int Id { get; set; }
    public int AgendamentoId { get; set; }
    public DateTime ScheduledSendAt { get; set; }
    public bool Sent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Domain.Entities;

public class Assinatura
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public int PlanoId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.None;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    public string? AsaasCustomerId { get; set; }
    public string? AsaasSubscriptionId { get; set; }
    public int AgendamentosNoMes { get; set; } = 0;
    public DateTime? LastResetAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

using HoraDaBeleza.Domain.Enums;

namespace HoraDaBeleza.Domain.Entities;

public class Subscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    /// <summary>Legacy FK – nullable; subscriptions are now user-scoped, not salon-scoped.</summary>
    public int? SalonId { get; set; }
    public int PlanId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Trial-related fields
    public DateTime? TrialStartDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    
    // Client count tracking
    public int CurrentClients { get; set; } = 0;
    
    // Next billing date for paid subscriptions
    public DateTime? NextBillingDate { get; set; }

    // Rastreamento de falhas de pagamento
    public DateTime? PaymentFailedAt { get; set; }

    // ID da assinatura recorrente no gateway Asaas
    public string? AsaasSubscriptionId { get; set; }
}

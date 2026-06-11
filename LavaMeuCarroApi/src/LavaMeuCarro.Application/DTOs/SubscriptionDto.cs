using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Application.DTOs;

public record SubscriptionDto(
    int Id,
    int UserId,
    int PlanId,
    string PlanName,
    SubscriptionStatus Status,
    PlanType PlanType,
    bool IsActive,
    DateTime StartDate,
    DateTime EndDate,
    DateTime? TrialStartDate,
    DateTime? TrialEndDate,
    int MaxClients,
    int CurrentClients,
    DateTime? NextBillingDate = null,
    bool IsTrialEligible = true
);

using HoraDaBeleza.Application.DTOs;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Enums;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.GetCurrentSubscriptionQuery;

public class GetCurrentSubscriptionQueryHandler(
    ISubscriptionRepository subscriptionRepository,
    IPlanRepository planRepository
) : IRequestHandler<GetCurrentSubscriptionQuery, SubscriptionDto>
{
    public async Task<SubscriptionDto> Handle(GetCurrentSubscriptionQuery request, CancellationToken ct)
    {
        // Elegível para trial apenas se nunca usou Trial ou Starter antes
        var hasUsedTrial = await subscriptionRepository.HasUsedTrialOrStarterAsync(request.UserId);
        var isTrialEligible = !hasUsedTrial;
        var subscription = await subscriptionRepository.GetActiveByUserAsync(request.UserId);
        if (subscription == null)
        {
            return new SubscriptionDto(
                Id: 0,
                UserId: request.UserId,
                PlanId: 0,
                PlanName: "Nenhum",
                Status: SubscriptionStatus.None,
                PlanType: PlanType.None,
                IsActive: false,
                StartDate: DateTime.UtcNow,
                EndDate: DateTime.UtcNow,
                TrialStartDate: null,
                TrialEndDate: null,
                MaxClients: 0,
                CurrentClients: 0,
                NextBillingDate: null,
                IsTrialEligible: isTrialEligible
            );
        }

        var plan = await planRepository.GetByIdAsync(subscription.PlanId);
        if (plan == null)
        {
            return new SubscriptionDto(
                Id: 0,
                UserId: request.UserId,
                PlanId: 0,
                PlanName: "Nenhum",
                Status: SubscriptionStatus.None,
                PlanType: PlanType.None,
                IsActive: false,
                StartDate: DateTime.UtcNow,
                EndDate: DateTime.UtcNow,
                TrialStartDate: null,
                TrialEndDate: null,
                MaxClients: 0,
                CurrentClients: 0,
                NextBillingDate: null,
                IsTrialEligible: isTrialEligible
            );
        }

        // Verificar se a assinatura está ativa baseado na data de expiração
        var isActive = subscription.Status == SubscriptionStatus.Active && 
                      DateTime.UtcNow <= subscription.EndDate;

        return new SubscriptionDto(
            Id: subscription.Id,
            UserId: subscription.UserId,
            PlanId: subscription.PlanId,
            PlanName: plan.Name,
            Status: subscription.Status,
            PlanType: plan.PlanType,
            IsActive: isActive,
            StartDate: subscription.StartDate,
            EndDate: subscription.EndDate,
            TrialStartDate: subscription.TrialStartDate,
            TrialEndDate: subscription.TrialEndDate,
            MaxClients: plan.MaxClients,
            CurrentClients: subscription.CurrentClients,
            NextBillingDate: subscription.NextBillingDate,
            IsTrialEligible: isTrialEligible
        );
    }
}
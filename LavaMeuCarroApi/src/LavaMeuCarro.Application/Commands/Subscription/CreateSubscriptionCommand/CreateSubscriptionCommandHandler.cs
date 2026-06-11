using HoraDaBeleza.Application.DTOs;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HoraDaBeleza.Application.Commands.Subscription.CreateSubscriptionCommand;

public class CreateSubscriptionCommandHandler(
    ISubscriptionRepository repo,
    IPlanRepository planRepo,
    IAsaasSubscriptionGateway asaasGateway,
    ILogger<CreateSubscriptionCommandHandler> logger
) : IRequestHandler<CreateSubscriptionCommand, SubscriptionDto>
{

    public async Task<SubscriptionDto> Handle(CreateSubscriptionCommand req, CancellationToken ct)
    {
        var plan = await planRepo.GetByIdAsync(req.PlanId) ?? throw new NotFoundException("Plan", req.PlanId);

        // Verificar se o plano é Trial/Starter e se o usuário já usou antes
        if (IsTrialOrStarterPlan(plan.PlanType))
        {
            var hasUsedTrial = await repo.HasUsedTrialOrStarterAsync(req.UserId);
            if (hasUsedTrial)
                throw new DomainException("O plano Starter/Trial só pode ser ativado uma vez por conta.");
        }

        // Cancel old Asaas subscription before switching plans (upgrade or downgrade)
        var oldSubscription = await repo.GetActiveByUserAsync(req.UserId);
        if (oldSubscription is not null && !string.IsNullOrWhiteSpace(oldSubscription.AsaasSubscriptionId))
        {
            if (asaasGateway.IsConfigured())
            {
                try
                {
                    var cancelled = await asaasGateway.CancelSubscriptionAsync(oldSubscription.AsaasSubscriptionId, ct);
                    if (!cancelled)
                    {
                        logger.LogWarning(
                            "[CreateSubscription] Asaas returned false when cancelling old subscription. " +
                            "UserId={UserId}, OldAsaasSubscriptionId={AsaasId}, NewPlanId={PlanId}.",
                            req.UserId, oldSubscription.AsaasSubscriptionId, req.PlanId);
                    }
                    else
                    {
                        logger.LogInformation(
                            "[CreateSubscription] Old Asaas subscription cancelled successfully. " +
                            "UserId={UserId}, OldAsaasSubscriptionId={AsaasId}, NewPlanId={PlanId}.",
                            req.UserId, oldSubscription.AsaasSubscriptionId, req.PlanId);
                    }
                }
                catch (Exception ex)
                {
                    // Log but do NOT block the plan change — user should not be stuck
                    logger.LogError(ex,
                        "[CreateSubscription] Failed to cancel old Asaas subscription during plan change. " +
                        "UserId={UserId}, OldAsaasSubscriptionId={AsaasId}, NewPlanId={PlanId}.",
                        req.UserId, oldSubscription.AsaasSubscriptionId, req.PlanId);
                }
            }
            else
            {
                logger.LogWarning(
                    "[CreateSubscription] Asaas gateway not configured — skipping old subscription cancellation. " +
                    "UserId={UserId}, OldAsaasSubscriptionId={AsaasId}.",
                    req.UserId, oldSubscription.AsaasSubscriptionId);
            }
        }

        await repo.CancelActiveByUserAsync(req.UserId);

        var now = DateTime.UtcNow;
        var subscription = new Domain.Entities.Subscription
        {
            UserId    = req.UserId,
            PlanId    = req.PlanId,
            Status    = Domain.Enums.SubscriptionStatus.Active,
            StartDate = now,
            EndDate   = now.AddDays(plan.PeriodDays),
            // Configurar trial se aplicável
            TrialStartDate = plan.PlanType == Domain.Enums.PlanType.Trial ? now : null,
            TrialEndDate = plan.PlanType == Domain.Enums.PlanType.Trial && plan.TrialDays.HasValue 
                ? now.AddDays(plan.TrialDays.Value) 
                : null,
            // Configurar próxima data de cobrança
            NextBillingDate = plan.PlanType != Domain.Enums.PlanType.Trial 
                ? now.AddDays(plan.PeriodDays) 
                : null,
            CurrentClients = 0
        };

        var id = await repo.CreateAsync(subscription);
        var isActive = subscription.Status == Domain.Enums.SubscriptionStatus.Active && 
                      DateTime.UtcNow <= subscription.EndDate;

        return new SubscriptionDto(
            Id: id,
            UserId: req.UserId,
            PlanId: req.PlanId,
            PlanName: plan.Name,
            Status: Domain.Enums.SubscriptionStatus.Active,
            PlanType: plan.PlanType,
            IsActive: isActive,
            StartDate: subscription.StartDate,
            EndDate: subscription.EndDate,
            TrialStartDate: subscription.TrialStartDate,
            TrialEndDate: subscription.TrialEndDate,
            MaxClients: plan.MaxClients,
            CurrentClients: subscription.CurrentClients,
            NextBillingDate: subscription.NextBillingDate,
            IsTrialEligible: false
        );
    }

    private static bool IsTrialOrStarterPlan(Domain.Enums.PlanType planType) =>
        planType is Domain.Enums.PlanType.Trial;
}

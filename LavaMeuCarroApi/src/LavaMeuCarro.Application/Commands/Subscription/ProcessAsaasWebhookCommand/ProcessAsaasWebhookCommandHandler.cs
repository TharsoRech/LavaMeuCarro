using CreateSubCmd = HoraDaBeleza.Application.Commands.Subscription.CreateSubscriptionCommand.CreateSubscriptionCommand;
using GetCurrentSubQuery = HoraDaBeleza.Application.Commands.Subscription.GetCurrentSubscriptionQuery.GetCurrentSubscriptionQuery;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace HoraDaBeleza.Application.Commands.Subscription.ProcessAsaasWebhookCommand;

public class ProcessAsaasWebhookCommandHandler(
    ISubscriptionRepository subscriptionRepository,
    ISalonRepository salonRepository,
    IUserRepository userRepository,
    IPlanRepository planRepository,
    ISubscriptionEmailService subscriptionEmailService,
    IAsaasSubscriptionGateway asaasGateway,
    IAsaasWebhookAuditRepository asaasWebhookAuditRepository,
    INewRelicLogService newRelicLogService,
    IMediator mediator,
    ILogger<ProcessAsaasWebhookCommandHandler> logger)
    : IRequestHandler<ProcessAsaasWebhookCommand, Unit>
{
    private static readonly HashSet<string> SuccessfulPaymentEvents = new(StringComparer.OrdinalIgnoreCase)
    {
        "PAYMENT_RECEIVED",
        "PAYMENT_CONFIRMED"
    };

    private static readonly HashSet<string> FailedPaymentEvents = new(StringComparer.OrdinalIgnoreCase)
    {
        "PAYMENT_OVERDUE",
        "PAYMENT_DELETED",
        "PAYMENT_REFUNDED",
        "PAYMENT_PARTIALLY_REFUNDED",
        "PAYMENT_CHARGEBACK_REQUESTED",
        "PAYMENT_CHARGEBACK_DISPUTE",
        "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
        "PAYMENT_BANK_SLIP_CANCELLED",
        "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
        "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
    };

    private static readonly HashSet<string> TerminalCancellationEvents = new(StringComparer.OrdinalIgnoreCase)
    {
        "SUBSCRIPTION_DELETED",
        "SUBSCRIPTION_INACTIVATED"
    };

    public async Task<Unit> Handle(ProcessAsaasWebhookCommand request, CancellationToken ct)
    {
        // Resolve externalReference from gateway if not present in payload
        var externalReference = request.ExternalReference;
        HoraDaBeleza.Application.Interfaces.AsaasSubscriptionInfo? asaasSubscription = null;
        if (!string.IsNullOrWhiteSpace(request.SubscriptionId))
        {
            asaasSubscription = await asaasGateway.GetSubscriptionAsync(request.SubscriptionId, ct);
            if (string.IsNullOrWhiteSpace(externalReference))
                externalReference = asaasSubscription?.ExternalReference;
        }

        if (!TryParseExternalReference(externalReference, out var userId, out var planId))
        {
            await newRelicLogService.LogAsync(
                LogLevel.Warning,
                "Evento Asaas ignorado: externalReference invalida ou ausente.",
                "asaas.subscription.event-ignored.invalid-reference",
                null,
                new Dictionary<string, object?>
                {
                    ["eventType"] = request.Event,
                    ["subscriptionGatewayId"] = request.SubscriptionId,
                    ["externalReference"] = externalReference,
                    ["amount"] = request.Amount
                },
                ct);

            logger.LogWarning(
                "Webhook Asaas ignorado por externalReference invalida. Event={Event}, SubscriptionId={SubscriptionId}, ExternalReference={ExternalReference}",
                request.Event,
                request.SubscriptionId,
                externalReference);
            return Unit.Value;
        }

        var normalizedEvent = (request.Event ?? string.Empty).Trim().ToUpperInvariant();

        if (SuccessfulPaymentEvents.Contains(normalizedEvent))
        {
            var current = await mediator.Send(new GetCurrentSubQuery(userId), ct);
            var isNew = !current.IsActive || current.PlanId != planId;

            if (isNew)
                await mediator.Send(new CreateSubCmd(userId, planId), ct);

            var activeSub = await subscriptionRepository.GetActiveByUserAsync(userId);
            if (activeSub is not null && !string.IsNullOrWhiteSpace(request.SubscriptionId))
            {
                activeSub.AsaasSubscriptionId = request.SubscriptionId;
                activeSub.PaymentFailedAt = null;
                await subscriptionRepository.UpdateAsync(activeSub);
            }

            var capturedUserId = userId;
            var capturedPlanId = planId;
            var capturedIsNew = isNew;
            var capturedAmount = request.Amount ?? asaasSubscription?.TransactionAmount;

            _ = Task.Run(async () =>
            {
                try
                {
                    var user = await userRepository.GetByIdAsync(capturedUserId);
                    var plan = await planRepository.GetByIdAsync(capturedPlanId);
                    var sub = await subscriptionRepository.GetActiveByUserAsync(capturedUserId);
                    if (user is null || plan is null || sub is null) return;

                    if (capturedIsNew)
                        await subscriptionEmailService.SendSubscriptionConfirmedAsync(user, plan, sub);
                    else
                        await subscriptionEmailService.SendPaymentSuccessAsync(
                            user, plan, sub, capturedAmount ?? plan.Price);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "[ProcessAsaasWebhook] Falha ao enviar e-mail. UserId={UserId}.", capturedUserId);
                }
            });

            await newRelicLogService.LogAsync(
                LogLevel.Information,
                $"Pagamento confirmado via Asaas: {normalizedEvent}",
                "asaas.subscription.payment-success",
                null,
                new Dictionary<string, object?>
                {
                    ["eventType"] = normalizedEvent,
                    ["userId"] = userId,
                    ["planId"] = planId,
                    ["subscriptionGatewayId"] = request.SubscriptionId,
                    ["externalReference"] = externalReference,
                    ["amount"] = request.Amount ?? asaasSubscription?.TransactionAmount
                },
                ct);

            await asaasWebhookAuditRepository.ResolveCheckoutLockAsync(
                externalReference,
                userId,
                "COMPLETED",
                $"Resolvido automaticamente por webhook {normalizedEvent}.",
                normalizedEvent,
                request.SubscriptionId,
                null,
                ct);
        }
        else if (TerminalCancellationEvents.Contains(normalizedEvent))
        {
            var active = await subscriptionRepository.GetActiveByUserAsync(userId);
            if (active is not null)
            {
                active.Status = SubscriptionStatus.Cancelled;
                active.PaymentFailedAt = null;
                await subscriptionRepository.UpdateAsync(active);
            }

            await salonRepository.UnpublishByOwnerAsync(userId, ct);

            await newRelicLogService.LogAsync(
                LogLevel.Warning,
                $"Assinatura encerrada no Asaas: {normalizedEvent}",
                "asaas.subscription.terminated",
                null,
                new Dictionary<string, object?>
                {
                    ["eventType"] = normalizedEvent,
                    ["userId"] = userId,
                    ["planId"] = planId,
                    ["subscriptionGatewayId"] = request.SubscriptionId,
                    ["externalReference"] = externalReference,
                    ["amount"] = request.Amount ?? asaasSubscription?.TransactionAmount
                },
                ct);

            await asaasWebhookAuditRepository.ResolveCheckoutLockAsync(
                externalReference,
                userId,
                "FAILED",
                $"Resolvido automaticamente por webhook {normalizedEvent}.",
                normalizedEvent,
                request.SubscriptionId,
                null,
                ct);
        }
        else if (FailedPaymentEvents.Contains(normalizedEvent))
        {
            var active = await subscriptionRepository.GetActiveByUserAsync(userId);
            if (active is not null)
            {
                active.Status = SubscriptionStatus.PaymentFailed;
                active.PaymentFailedAt = DateTime.UtcNow;
                await subscriptionRepository.UpdateAsync(active);

                var capturedUserId = userId;
                var capturedPlanId = planId;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        var user = await userRepository.GetByIdAsync(capturedUserId);
                        var plan = await planRepository.GetByIdAsync(capturedPlanId);
                        if (user is not null && plan is not null)
                            await subscriptionEmailService.SendPaymentFailedAsync(user, plan);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "[ProcessAsaasWebhook] Falha ao enviar e-mail de falha. UserId={UserId}.", capturedUserId);
                    }
                });
            }

            await newRelicLogService.LogAsync(
                LogLevel.Warning,
                $"Pagamento/assinatura sinalizado como problema via Asaas: {normalizedEvent}",
                "asaas.subscription.payment-failure",
                null,
                new Dictionary<string, object?>
                {
                    ["eventType"] = normalizedEvent,
                    ["userId"] = userId,
                    ["planId"] = planId,
                    ["subscriptionGatewayId"] = request.SubscriptionId,
                    ["externalReference"] = externalReference,
                    ["amount"] = request.Amount ?? asaasSubscription?.TransactionAmount
                },
                ct);

            await asaasWebhookAuditRepository.ResolveCheckoutLockAsync(
                externalReference,
                userId,
                "FAILED",
                $"Resolvido automaticamente por webhook {normalizedEvent}.",
                normalizedEvent,
                request.SubscriptionId,
                null,
                ct);
        }
        else
        {
            await newRelicLogService.LogAsync(
                LogLevel.Information,
                $"Evento Asaas recebido sem acao de negocio: {normalizedEvent}",
                "asaas.subscription.event-observed",
                null,
                new Dictionary<string, object?>
                {
                    ["eventType"] = normalizedEvent,
                    ["userId"] = userId,
                    ["planId"] = planId,
                    ["subscriptionGatewayId"] = request.SubscriptionId,
                    ["externalReference"] = externalReference,
                    ["amount"] = request.Amount ?? asaasSubscription?.TransactionAmount
                },
                ct);
        }

        logger.LogInformation(
            "Webhook Asaas processado. Event={Event}, SubscriptionId={SubscriptionId}, UserId={UserId}, PlanId={PlanId}",
            normalizedEvent, request.SubscriptionId, userId, planId);

        return Unit.Value;
    }

    private static bool TryParseExternalReference(string? externalReference, out int userId, out int planId)
    {
        userId = 0; planId = 0;
        if (string.IsNullOrWhiteSpace(externalReference)) return false;

        var userMatch = Regex.Match(externalReference, @"user[:_-]?(\d+)", RegexOptions.IgnoreCase);
        var planMatch = Regex.Match(externalReference, @"plan[:_-]?(\d+)", RegexOptions.IgnoreCase);

        return userMatch.Success
            && planMatch.Success
            && int.TryParse(userMatch.Groups[1].Value, out userId)
            && int.TryParse(planMatch.Groups[1].Value, out planId);
    }
}


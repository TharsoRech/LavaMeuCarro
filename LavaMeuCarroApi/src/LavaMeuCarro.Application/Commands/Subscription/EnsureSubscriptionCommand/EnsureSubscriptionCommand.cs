using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.EnsureSubscriptionCommand;

public record EnsureSubscriptionCommand(
    int UserId,
    int PlanId,
    IEnumerable<LegalConsentRequest>? Consents,
    string? IpAddress,
    string? UserAgent) : IRequest<EnsureSubscriptionResult>;

public record EnsureSubscriptionResult(SubscriptionDto Subscription, bool AlreadyActive);


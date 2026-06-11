using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.ActivateTrialCommand;

public record ActivateTrialCommand(
    int UserId,
    IEnumerable<LegalConsentRequest>? Consents,
    string? IpAddress,
    string? UserAgent) : IRequest<SubscriptionDto>;


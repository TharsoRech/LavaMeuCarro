using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.StartAsaasCheckoutCommand;

public record StartAsaasCheckoutCommand(
    int UserId,
    int PlanId,
    string? BackUrl,
    IEnumerable<LegalConsentRequest>? Consents,
    string? IpAddress,
    string? UserAgent) : IRequest<StartAsaasCheckoutResult>;

public record StartAsaasCheckoutResult(
    bool Success,
    int StatusCode,
    string? CheckoutUrl,
    string? ExternalReference,
    string? Status,
    string? Error,
    DateTime? PendingUntilUtc = null,
    bool AlreadyPending = false);


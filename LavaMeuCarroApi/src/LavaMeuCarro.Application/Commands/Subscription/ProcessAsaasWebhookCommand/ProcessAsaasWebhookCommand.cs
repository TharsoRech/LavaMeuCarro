using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.ProcessAsaasWebhookCommand;

public record ProcessAsaasWebhookCommand(
    string? Event,
    string? SubscriptionId,
    string? ExternalReference,
    decimal? Amount) : IRequest<Unit>;


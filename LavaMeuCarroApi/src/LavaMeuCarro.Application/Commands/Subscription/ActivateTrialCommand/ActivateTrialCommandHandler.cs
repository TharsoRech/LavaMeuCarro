using CreateSubCmd = HoraDaBeleza.Application.Commands.Subscription.CreateSubscriptionCommand.CreateSubscriptionCommand;
using HoraDaBeleza.Application.DTOs;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Enums;
using HoraDaBeleza.Domain.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HoraDaBeleza.Application.Commands.Subscription.ActivateTrialCommand;

public class ActivateTrialCommandHandler(
    IPlanRepository planRepository,
    ILegalDocumentRepository legalDocumentRepository,
    IUserRepository userRepository,
    ISubscriptionRepository subscriptionRepository,
    ISubscriptionEmailService subscriptionEmailService,
    IMediator mediator,
    ILogger<ActivateTrialCommandHandler> logger)
    : IRequestHandler<ActivateTrialCommand, SubscriptionDto>
{
    public async Task<SubscriptionDto> Handle(ActivateTrialCommand request, CancellationToken ct)
    {
        await ValidateConsentsAsync(request.Consents, legalDocumentRepository);

        var trialPlan = (await planRepository.ListActiveAsync())
            .FirstOrDefault(p => p.PlanType == PlanType.Trial || p.Price == 0)
            ?? throw new NotFoundException("Trial plan", 0);

        var result = await mediator.Send(new CreateSubCmd(request.UserId, trialPlan.Id), ct);

        await legalDocumentRepository.SaveAcceptedConsentsAsync(
            request.UserId, "subscription", request.Consents ?? [], request.IpAddress, request.UserAgent);

        _ = Task.Run(async () =>
        {
            try
            {
                var user = await userRepository.GetByIdAsync(request.UserId);
                var subscription = await subscriptionRepository.GetActiveByUserAsync(request.UserId);
                if (user is not null && subscription is not null)
                    await subscriptionEmailService.SendSubscriptionConfirmedAsync(user, trialPlan, subscription);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[ActivateTrialCommand] Falha ao enviar e-mail de trial. UserId={UserId}.", request.UserId);
            }
        });

        return result;
    }

    private static async Task ValidateConsentsAsync(
        IEnumerable<LegalConsentRequest>? consents,
        ILegalDocumentRepository legalDocumentRepository)
    {
        var required = (await legalDocumentRepository.GetActiveByContextAsync("subscription"))
            .Where(d => d.IsRequired).ToList();

        if (required.Count == 0) return;

        var accepted = (consents ?? [])
            .Where(c => !string.IsNullOrWhiteSpace(c.Code) && !string.IsNullOrWhiteSpace(c.Version))
            .ToDictionary(c => c.Code.Trim(), c => c.Version.Trim(), StringComparer.OrdinalIgnoreCase);

        var missing = required
            .Where(d => !accepted.TryGetValue(d.Code, out var v) || !string.Equals(v, d.Version, StringComparison.OrdinalIgnoreCase))
            .Select(d => d.Title).ToList();

        if (missing.Count > 0)
            throw new BusinessException($"Aceite obrigatório pendente: {string.Join(", ", missing)}.");
    }
}


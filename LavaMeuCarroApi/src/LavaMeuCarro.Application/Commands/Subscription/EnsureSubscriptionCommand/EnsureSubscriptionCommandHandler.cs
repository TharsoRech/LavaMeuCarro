using CreateSubCmd = HoraDaBeleza.Application.Commands.Subscription.CreateSubscriptionCommand.CreateSubscriptionCommand;
using GetCurrentSubQuery = HoraDaBeleza.Application.Commands.Subscription.GetCurrentSubscriptionQuery.GetCurrentSubscriptionQuery;
using HoraDaBeleza.Application.DTOs;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Exceptions;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.EnsureSubscriptionCommand;

public class EnsureSubscriptionCommandHandler(
    ILegalDocumentRepository legalDocumentRepository,
    IMediator mediator)
    : IRequestHandler<EnsureSubscriptionCommand, EnsureSubscriptionResult>
{
    public async Task<EnsureSubscriptionResult> Handle(EnsureSubscriptionCommand request, CancellationToken ct)
    {
        if (request.PlanId <= 0)
            throw new BusinessException("planId is required.");

        await ValidateConsentsAsync(request.Consents, legalDocumentRepository);

        var current = await mediator.Send(new GetCurrentSubQuery(request.UserId), ct);
        if (current.IsActive && current.PlanId == request.PlanId)
            return new EnsureSubscriptionResult(current, AlreadyActive: true);

        var result = await mediator.Send(new CreateSubCmd(request.UserId, request.PlanId), ct);
        await legalDocumentRepository.SaveAcceptedConsentsAsync(
            request.UserId, "subscription", request.Consents ?? [], request.IpAddress, request.UserAgent);

        return new EnsureSubscriptionResult(result, AlreadyActive: false);
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


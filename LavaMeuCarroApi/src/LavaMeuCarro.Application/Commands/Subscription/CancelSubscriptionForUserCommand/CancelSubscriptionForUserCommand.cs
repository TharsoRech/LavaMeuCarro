using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.CancelSubscriptionForUserCommand;

public record CancelSubscriptionForUserCommand(
	int UserId,
	string? Reason = null,
	string Source = "user") : IRequest<CancelSubscriptionForUserResult>;

public record CancelSubscriptionForUserResult(SubscriptionDto Current);


using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.CreateSubscriptionCommand;

public record CreateSubscriptionCommand(int UserId, int PlanId) : IRequest<SubscriptionDto>;

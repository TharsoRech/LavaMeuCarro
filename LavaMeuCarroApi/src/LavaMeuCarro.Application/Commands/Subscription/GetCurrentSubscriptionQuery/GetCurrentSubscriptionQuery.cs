using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.GetCurrentSubscriptionQuery;

public record GetCurrentSubscriptionQuery(int UserId) : IRequest<SubscriptionDto>;

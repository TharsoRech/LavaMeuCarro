using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Subscription.VerifyAppleReceiptCommand;

public record VerifyAppleReceiptCommand(int UserId, string Receipt) : IRequest<SubscriptionDto>;

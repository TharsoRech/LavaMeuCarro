using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Review.CreateReviewCommand;

public record CreateReviewCommand(int AppointmentId, int ClientId, int Rating, string? Comment) : IRequest<ReviewDto>;

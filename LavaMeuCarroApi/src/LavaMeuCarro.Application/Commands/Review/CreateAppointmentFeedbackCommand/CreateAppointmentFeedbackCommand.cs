using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Review.CreateAppointmentFeedbackCommand;

public record CreateAppointmentFeedbackCommand(
    int AppointmentId,
    int UserId,
    int? SalonRating,
    int? ProfessionalRating,
    string? Comment) : IRequest<CreateAppointmentFeedbackResult>;

public record CreateAppointmentFeedbackResult(
    bool Success,
    int StatusCode,
    string? Error,
    IReadOnlyList<ReviewDto> Reviews);


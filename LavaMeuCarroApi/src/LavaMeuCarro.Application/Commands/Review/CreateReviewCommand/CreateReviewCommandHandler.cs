using HoraDaBeleza.Application.DTOs;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Enums;
using HoraDaBeleza.Domain.Exceptions;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Review.CreateReviewCommand;

public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, ReviewDto>
{
    private readonly IReviewRepository _reviewRepo;
    private readonly IAppointmentRepository _appointmentRepo;
    private readonly IUserRepository _userRepo;
    private readonly INewRelicLogService _newRelicLogService;

    public CreateReviewCommandHandler(
        IReviewRepository reviewRepo,
        IAppointmentRepository appointmentRepo,
        IUserRepository userRepo,
        INewRelicLogService newRelicLogService)
    {
        _reviewRepo = reviewRepo;
        _appointmentRepo = appointmentRepo;
        _userRepo = userRepo;
        _newRelicLogService = newRelicLogService;
    }

    public async Task<ReviewDto> Handle(CreateReviewCommand req, CancellationToken ct)
    {
        var appointment = await _appointmentRepo.GetByIdAsync(req.AppointmentId);
        if (appointment == null)
        {
            await _newRelicLogService.LogAsync(
                Microsoft.Extensions.Logging.LogLevel.Warning,
                $"CreateReview: agendamento não encontrado. Id={req.AppointmentId}",
                "review.create.notfound.appointment",
                null,
                new Dictionary<string, object?> { ["appointmentId"] = req.AppointmentId },
                ct);
            throw new NotFoundException("Appointment", req.AppointmentId);
        }
        if (appointment.ClientId != req.ClientId)
        {
            await _newRelicLogService.LogAsync(
                Microsoft.Extensions.Logging.LogLevel.Warning,
                $"CreateReview: tentativa de avaliação não autorizada. AppointmentId={req.AppointmentId} ClientId={req.ClientId}",
                "review.create.unauthorized",
                null,
                new Dictionary<string, object?> { ["appointmentId"] = req.AppointmentId, ["clientId"] = req.ClientId },
                ct);
            throw new UnauthorizedException("You cannot review this appointment.");
        }
        if (appointment.Status != AppointmentStatus.Completed)
        {
            await _newRelicLogService.LogAsync(
                Microsoft.Extensions.Logging.LogLevel.Warning,
                $"CreateReview: avaliação de agendamento não concluído. AppointmentId={req.AppointmentId}",
                "review.create.notcompleted",
                null,
                new Dictionary<string, object?> { ["appointmentId"] = req.AppointmentId },
                ct);
            throw new BusinessException("You can only review completed appointments.");
        }
        if (await _reviewRepo.ReviewExistsForAppointmentAsync(req.AppointmentId, ReviewTarget.Salon))
        {
            await _newRelicLogService.LogAsync(
                Microsoft.Extensions.Logging.LogLevel.Warning,
                $"CreateReview: avaliação duplicada. AppointmentId={req.AppointmentId}",
                "review.create.duplicate",
                null,
                new Dictionary<string, object?> { ["appointmentId"] = req.AppointmentId },
                ct);
            throw new BusinessException("This appointment has already been reviewed.");
        }
        var client = await _userRepo.GetByIdAsync(req.ClientId);

        var review = new Domain.Entities.Review
        {
            AppointmentId  = req.AppointmentId,
            ClientId       = req.ClientId,
            ProfessionalId = appointment.ProfessionalId,
            SalonId        = appointment.SalonId,
            TargetType     = ReviewTarget.Salon,
            Rating         = req.Rating,
            Comment        = req.Comment
        };

        var id = await _reviewRepo.CreateAsync(review);
        return new ReviewDto(id, req.AppointmentId, req.ClientId, client?.Name ?? "", req.Rating, req.Comment, DateTime.UtcNow);
    }
}

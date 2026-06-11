using HoraDaBeleza.Application.DTOs;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Entities;
using HoraDaBeleza.Domain.Enums;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Review.CreateProfessionalReviewCommand;

public class CreateProfessionalReviewCommandHandler(
    IAppointmentRepository appointmentRepository,
    IReviewRepository reviewRepository,
    IUserRepository userRepository)
    : IRequestHandler<CreateProfessionalReviewCommand, CreateProfessionalReviewResult>
{
    public async Task<CreateProfessionalReviewResult> Handle(CreateProfessionalReviewCommand request, CancellationToken cancellationToken)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return new CreateProfessionalReviewResult(null, false, false, "Rating must be between 1 and 5.");

        var completedAppointment = (await appointmentRepository.ListByClientAsync(request.UserId))
            .Where(a => a.ProfessionalId == request.ProfessionalId && a.Status == AppointmentStatus.Completed)
            .OrderByDescending(a => a.ScheduledAt)
            .FirstOrDefault();

        if (completedAppointment is null)
            return new CreateProfessionalReviewResult(null, false, false, "User must complete an appointment before reviewing this professional.");

        var alreadyReviewed = await reviewRepository.ReviewExistsForAppointmentAsync(
            completedAppointment.Id,
            ReviewTarget.Professional);

        if (alreadyReviewed)
            return new CreateProfessionalReviewResult(null, false, true, "This appointment was already reviewed.");

        var review = new HoraDaBeleza.Domain.Entities.Review
        {
            AppointmentId = completedAppointment.Id,
            ClientId = request.UserId,
            ProfessionalId = request.ProfessionalId,
            SalonId = completedAppointment.SalonId,
            TargetType = ReviewTarget.Professional,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        review.Id = await reviewRepository.CreateAsync(review);

        var user = await userRepository.GetByIdAsync(review.ClientId);
        var dto = new ReviewDto(
            review.Id,
            review.AppointmentId,
            review.ClientId,
            user?.Name ?? "Cliente",
            review.Rating,
            review.Comment,
            review.CreatedAt);

        return new CreateProfessionalReviewResult(dto, true, false, null);
    }
}



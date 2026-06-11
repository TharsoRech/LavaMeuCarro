using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Commands.Review.CreateProfessionalReviewCommand;

public record CreateProfessionalReviewCommand(int UserId, int ProfessionalId, int Rating, string? Comment)
	: IRequest<CreateProfessionalReviewResult>;

public record CreateProfessionalReviewResult(ReviewDto? Review, bool Success, bool IsConflict, string? Error);


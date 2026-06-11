using MediatR;

namespace HoraDaBeleza.Application.Queries.Reviews;

public record CanReviewSalonQuery(int UserId, int SalonId) : IRequest<bool>;


using MediatR;

namespace HoraDaBeleza.Application.Queries.Reviews;

public record CanReviewProfessionalQuery(int UserId, int ProfessionalId) : IRequest<bool>;


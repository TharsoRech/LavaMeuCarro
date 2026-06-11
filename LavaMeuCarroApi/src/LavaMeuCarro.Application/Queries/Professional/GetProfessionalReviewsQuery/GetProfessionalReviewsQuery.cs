using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Queries.Professionals.GetProfessionalReviewsQuery;

public record GetProfessionalReviewsQuery(int ProfessionalId) : IRequest<IReadOnlyList<ReviewDto>>;


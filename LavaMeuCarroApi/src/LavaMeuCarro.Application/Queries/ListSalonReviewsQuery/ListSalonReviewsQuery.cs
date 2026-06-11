using HoraDaBeleza.Application.DTOs;
using MediatR;

namespace HoraDaBeleza.Application.Queries.ListSalonReviewsQuery;

public record ListSalonReviewsQuery(int SalonId) : IRequest<IEnumerable<ReviewDto>>;

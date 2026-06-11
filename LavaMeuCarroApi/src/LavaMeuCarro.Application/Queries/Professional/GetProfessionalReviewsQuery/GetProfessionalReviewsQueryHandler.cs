using HoraDaBeleza.Application.DTOs;
using HoraDaBeleza.Application.Interfaces;
using MediatR;

namespace HoraDaBeleza.Application.Queries.Professionals.GetProfessionalReviewsQuery;

public class GetProfessionalReviewsQueryHandler(
    IReviewRepository reviewRepository,
    IUserRepository userRepository)
    : IRequestHandler<GetProfessionalReviewsQuery, IReadOnlyList<ReviewDto>>
{
    public async Task<IReadOnlyList<ReviewDto>> Handle(GetProfessionalReviewsQuery request, CancellationToken cancellationToken)
    {
        var reviews = await reviewRepository.ListByProfessionalAsync(request.ProfessionalId);
        var items = new List<ReviewDto>();

        foreach (var review in reviews)
        {
            var user = await userRepository.GetByIdAsync(review.ClientId);
            items.Add(new ReviewDto(
                review.Id,
                review.AppointmentId,
                review.ClientId,
                user?.Name ?? "Cliente",
                review.Rating,
                review.Comment,
                review.CreatedAt));
        }

        return items;
    }
}


using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Enums;
using MediatR;

namespace HoraDaBeleza.Application.Queries.Reviews;

public class CanReviewSalonQueryHandler(IAppointmentRepository appointmentRepository)
    : IRequestHandler<CanReviewSalonQuery, bool>
{
    public async Task<bool> Handle(CanReviewSalonQuery request, CancellationToken cancellationToken)
    {
        var appointments = await appointmentRepository.ListByClientAsync(request.UserId);
        return appointments.Any(a => a.SalonId == request.SalonId && a.Status == AppointmentStatus.Completed);
    }
}


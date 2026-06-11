using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Enums;
using MediatR;

namespace HoraDaBeleza.Application.Queries.Reviews;

public class CanReviewProfessionalQueryHandler(IAppointmentRepository appointmentRepository)
    : IRequestHandler<CanReviewProfessionalQuery, bool>
{
    public async Task<bool> Handle(CanReviewProfessionalQuery request, CancellationToken cancellationToken)
    {
        var appointments = await appointmentRepository.ListByClientAsync(request.UserId);
        return appointments.Any(a => a.ProfessionalId == request.ProfessionalId && a.Status == AppointmentStatus.Completed);
    }
}


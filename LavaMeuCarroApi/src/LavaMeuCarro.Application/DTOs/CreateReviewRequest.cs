namespace HoraDaBeleza.Application.DTOs;

public record CreateReviewRequest(int AppointmentId, int Rating, string? Comment);

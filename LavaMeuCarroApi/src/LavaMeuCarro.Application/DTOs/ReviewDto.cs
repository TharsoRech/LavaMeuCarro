namespace HoraDaBeleza.Application.DTOs;

public record ReviewDto(int Id, int AppointmentId, int ClientId, string ClientName, int Rating,
    string? Comment, DateTime CreatedAt);

using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Application.DTOs;

public record AssinaturaDTO(int Id, int OwnerId, int PlanoId, SubscriptionStatus Status, DateTime? StartDate, DateTime? EndDate, DateTime? TrialEndDate, int AgendamentosNoMes, DateTime? LastResetAt, string? PlanoName, decimal? PlanoPrice, int? PlanoLimit);
public record PlanoDTO(int Id, string Name, string? Description, decimal Price, int PeriodDays, int? AppointmentLimit, bool Active);
public record ActivateTrialRequest(int PlanoId);
public record ProcessPaidRequest(int PlanoId);
public record StartCheckoutRequest(int PlanoId, string? CardId);
public record CheckoutResponse(string CheckoutUrl, string? CheckoutId);
public record CardDTO(int Id, string? LastFourDigits, string? Brand, bool IsDefault);
public record SaveCardRequest(string AsaasCardId, string? LastFourDigits, string? Brand);
public record PaymentHistoryDTO(int Id, decimal? Value, string? Status, DateTime? PaymentDate, DateTime CreatedAt);

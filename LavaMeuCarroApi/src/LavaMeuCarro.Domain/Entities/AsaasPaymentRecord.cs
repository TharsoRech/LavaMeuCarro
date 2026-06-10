namespace LavaMeuCarro.Domain.Entities;

public class AsaasPaymentRecord
{
    public int Id { get; set; }
    public int AssinaturaId { get; set; }
    public string? AsaasPaymentId { get; set; }
    public string? Status { get; set; }
    public decimal? Value { get; set; }
    public DateTime? PaymentDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

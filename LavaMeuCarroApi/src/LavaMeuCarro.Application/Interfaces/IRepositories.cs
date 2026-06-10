using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Application.Interfaces;

public interface ICategoriaRepository
{
    Task<List<Categoria>> GetAllAsync();
    Task<Categoria?> GetByIdAsync(int id);
    Task<int> CreateAsync(Categoria categoria);
    Task UpdateAsync(Categoria categoria);
    Task DeleteAsync(int id);
}

public interface IAssinaturaRepository
{
    Task<Assinatura?> GetByOwnerAsync(int ownerId);
    Task<Assinatura?> GetByIdAsync(int id);
    Task<int> CreateAsync(Assinatura assinatura);
    Task UpdateAsync(Assinatura assinatura);
    Task<List<Assinatura>> GetAllAsync(int page, int pageSize);
    Task<(List<Assinatura> Items, int Total)> GetPagedAsync(int page, int pageSize, SubscriptionStatus? status);
    Task<int> CountActiveAsync();
    Task<int> CountByStatusAsync(SubscriptionStatus status);
}

public interface IPlanoRepository
{
    Task<List<Plano>> GetAllAsync();
    Task<Plano?> GetByIdAsync(int id);
    Task<int> CreateAsync(Plano plano);
    Task UpdateAsync(Plano plano);
    Task DeleteAsync(int id);
}

public interface INotificacaoRepository
{
    Task<List<Notificacao>> GetByUserAsync(int userId);
    Task<int> CreateAsync(Notificacao notificacao);
    Task MarkReadAsync(int id);
    Task MarkAllReadAsync(int userId);
    Task<int> CountUnreadAsync(int userId);
}

public interface IPushDeviceTokenRepository
{
    Task<int> UpsertAsync(PushDeviceToken token);
    Task RemoveByDeviceIdAsync(string deviceId);
    Task<List<PushDeviceToken>> GetByUserAsync(int userId);
    Task<List<PushDeviceToken>> GetAllActiveAsync();
}

public interface IAvaliacaoRepository
{
    Task<List<Avaliacao>> GetByUnidadeAsync(int unidadeId);
    Task<List<Avaliacao>> GetByFuncionarioAsync(int funcionarioId);
    Task<int> CreateAsync(Avaliacao avaliacao);
    Task<bool> HasReviewedAsync(int agendamentoId, int clientId);
}

public interface ILegalDocumentRepository
{
    Task<List<LegalDocument>> GetByContextAsync(string context);
    Task<LegalDocument?> GetByCodeAsync(string code);
}

public interface IUserAcceptanceRepository
{
    Task<int> CreateAsync(UserAcceptance acceptance);
    Task<List<UserAcceptance>> GetByUserAsync(int userId);
}

public interface INpsFeedbackRepository
{
    Task<bool> ShouldShowAsync(int userId);
    Task<int> CreateAsync(NpsFeedback feedback);
}

public interface ICardRepository
{
    Task<List<Card>> GetByUserAsync(int userId);
    Task<int> CreateAsync(Card card);
    Task DeleteAsync(int id);
    Task SetDefaultAsync(int userId, int cardId);
}

public interface ISupportSettingRepository
{
    Task<string?> GetValueAsync(string key);
    Task SetValueAsync(string key, string value);
    Task<Dictionary<string, string>> GetAllAsync();
}

public interface IAsaasPaymentRecordRepository
{
    Task<List<AsaasPaymentRecord>> GetByAssinaturaAsync(int assinaturaId);
    Task<(List<AsaasPaymentRecord> Items, int Total)> GetPagedAsync(int page, int pageSize, string? status);
    Task<int> CreateAsync(AsaasPaymentRecord record);
}

public interface IAdicionalRepository
{
    Task<List<AdicionalServico>> GetByUnidadeAsync(int unidadeId);
    Task<List<AdicionalServico>> GetByIdsAsync(List<int> ids);
    Task<int> CreateAsync(AdicionalServico adicional);
    Task UpdateAsync(AdicionalServico adicional);
    Task DeleteAsync(int id);
}

public interface IPushNotificationService
{
    Task SendPushAsync(int userId, string title, string body, Dictionary<string, string>? data);
    Task SendToTokenAsync(string token, string title, string body, Dictionary<string, string>? data);
}

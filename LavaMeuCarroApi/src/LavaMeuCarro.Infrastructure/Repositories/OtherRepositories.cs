using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly IDbConnectionFactory _factory;
    public RefreshTokenRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<int> CreateAsync(RefreshToken t) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO RefreshTokens (UserId, TokenHash, ExpiresAt, CreatedAt) VALUES (@UserId, @TokenHash, @ExpiresAt, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", t); }
    public async Task<RefreshToken?> GetByHashAsync(string hash) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<RefreshToken>("SELECT * FROM RefreshTokens WHERE TokenHash = @Hash", new { Hash = hash }); }
    public async Task RevokeAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE RefreshTokens SET IsRevoked = 1 WHERE Id = @Id", new { Id = id }); }
    public async Task RevokeAllByUserAsync(int userId) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE RefreshTokens SET IsRevoked = 1 WHERE UserId = @UserId AND IsRevoked = 0", new { UserId = userId }); }
}

public class CategoriaRepository : ICategoriaRepository
{
    private readonly IDbConnectionFactory _factory;
    public CategoriaRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<Categoria>> GetAllAsync() { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Categoria>("SELECT * FROM Categorias WHERE Active = 1")).ToList(); }
    public async Task<Categoria?> GetByIdAsync(int id) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Categoria>("SELECT * FROM Categorias WHERE Id = @Id", new { Id = id }); }
    public async Task<int> CreateAsync(Categoria c) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Categorias (Name, IconUrl, Active) VALUES (@Name, @IconUrl, @Active); SELECT CAST(SCOPE_IDENTITY() AS INT)", c); }
    public async Task UpdateAsync(Categoria c) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Categorias SET Name=@Name, IconUrl=@IconUrl, Active=@Active WHERE Id=@Id", c); }
    public async Task DeleteAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Categorias SET Active = 0 WHERE Id = @Id", new { Id = id }); }
}

public class AssinaturaRepository : IAssinaturaRepository
{
    private readonly IDbConnectionFactory _factory;
    public AssinaturaRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<Assinatura?> GetByOwnerAsync(int ownerId) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Assinatura>("SELECT * FROM Assinaturas WHERE OwnerId = @OwnerId", new { OwnerId = ownerId }); }
    public async Task<Assinatura?> GetByIdAsync(int id) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Assinatura>("SELECT * FROM Assinaturas WHERE Id = @Id", new { Id = id }); }
    public async Task<int> CreateAsync(Assinatura a) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Assinaturas (OwnerId, PlanoId, Status, StartDate, EndDate, TrialEndDate, AgendamentosNoMes, CreatedAt) VALUES (@OwnerId, @PlanoId, @Status, @StartDate, @EndDate, @TrialEndDate, @AgendamentosNoMes, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", a); }
    public async Task UpdateAsync(Assinatura a) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Assinaturas SET Status=@Status, StartDate=@StartDate, EndDate=@EndDate, AgendamentosNoMes=@AgendamentosNoMes, LastResetAt=@LastResetAt, UpdatedAt=GETUTCDATE() WHERE Id=@Id", a); }
    public async Task<List<Assinatura>> GetAllAsync(int page, int pageSize) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Assinatura>("SELECT * FROM Assinaturas ORDER BY Id DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", new { Offset = (page-1)*pageSize, PageSize = pageSize })).ToList(); }
    public async Task<(List<Assinatura> Items, int Total)> GetPagedAsync(int page, int pageSize, SubscriptionStatus? status) { using var db = _factory.CreateConnection(); var where = status.HasValue ? "WHERE Status = @Status" : ""; var total = await db.QuerySingleAsync<int>($"SELECT COUNT(*) FROM Assinaturas {where}", new { Status = status }); var items = (await db.QueryAsync<Assinatura>($"SELECT * FROM Assinaturas {where} ORDER BY Id DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", new { Status = status, Offset = (page-1)*pageSize, PageSize = pageSize })).ToList(); return (items, total); }
    public async Task<int> CountActiveAsync() { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("SELECT COUNT(*) FROM Assinaturas WHERE Status = 1"); }
    public async Task<int> CountByStatusAsync(SubscriptionStatus status) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("SELECT COUNT(*) FROM Assinaturas WHERE Status = @Status", new { Status = (int)status }); }
}

public class PlanoRepository : IPlanoRepository
{
    private readonly IDbConnectionFactory _factory;
    public PlanoRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<Plano>> GetAllAsync() { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Plano>("SELECT * FROM Planos WHERE Active = 1")).ToList(); }
    public async Task<Plano?> GetByIdAsync(int id) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<Plano>("SELECT * FROM Planos WHERE Id = @Id", new { Id = id }); }
    public async Task<int> CreateAsync(Plano p) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Planos (Name, Description, Price, PeriodDays, AppointmentLimit, Active, CreatedAt) VALUES (@Name, @Description, @Price, @PeriodDays, @AppointmentLimit, @Active, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", p); }
    public async Task UpdateAsync(Plano p) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Planos SET Name=@Name, Description=@Description, Price=@Price, PeriodDays=@PeriodDays, AppointmentLimit=@AppointmentLimit, Active=@Active WHERE Id=@Id", p); }
    public async Task DeleteAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Planos SET Active = 0 WHERE Id = @Id", new { Id = id }); }
}

public class NotificacaoRepository : INotificacaoRepository
{
    private readonly IDbConnectionFactory _factory;
    public NotificacaoRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<Notificacao>> GetByUserAsync(int userId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Notificacao>("SELECT * FROM Notificacoes WHERE UserId = @UserId ORDER BY CreatedAt DESC", new { UserId = userId })).ToList(); }
    public async Task<int> CreateAsync(Notificacao n) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Notificacoes (UserId, Title, Body, Type, ReferenceId, ReferenceType, CreatedAt) VALUES (@UserId, @Title, @Body, @Type, @ReferenceId, @ReferenceType, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", n); }
    public async Task MarkReadAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Notificacoes SET IsRead = 1 WHERE Id = @Id", new { Id = id }); }
    public async Task MarkAllReadAsync(int userId) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Notificacoes SET IsRead = 1 WHERE UserId = @UserId AND IsRead = 0", new { UserId = userId }); }
    public async Task<int> CountUnreadAsync(int userId) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("SELECT COUNT(*) FROM Notificacoes WHERE UserId = @UserId AND IsRead = 0", new { UserId = userId }); }
}

public class AvaliacaoRepository : IAvaliacaoRepository
{
    private readonly IDbConnectionFactory _factory;
    public AvaliacaoRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<Avaliacao>> GetByUnidadeAsync(int unidadeId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Avaliacao>("SELECT * FROM Avaliacoes WHERE UnidadeId = @UnidadeId ORDER BY CreatedAt DESC", new { UnidadeId = unidadeId })).ToList(); }
    public async Task<List<Avaliacao>> GetByFuncionarioAsync(int funcionarioId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Avaliacao>("SELECT * FROM Avaliacoes WHERE FuncionarioId = @FuncionarioId ORDER BY CreatedAt DESC", new { FuncionarioId = funcionarioId })).ToList(); }
    public async Task<int> CreateAsync(Avaliacao a) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Avaliacoes (AgendamentoId, ClientId, FuncionarioId, UnidadeId, TargetType, Rating, Comment, Fotos, CreatedAt) VALUES (@AgendamentoId, @ClientId, @FuncionarioId, @UnidadeId, @TargetType, @Rating, @Comment, @Fotos, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", a); }
    public async Task<bool> HasReviewedAsync(int agendamentoId, int clientId) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("SELECT COUNT(*) FROM Avaliacoes WHERE AgendamentoId = @AgendamentoId AND ClientId = @ClientId", new { AgendamentoId = agendamentoId, ClientId = clientId }) > 0; }
}

public class LegalDocumentRepository : ILegalDocumentRepository
{
    private readonly IDbConnectionFactory _factory;
    public LegalDocumentRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<LegalDocument>> GetByContextAsync(string context) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<LegalDocument>("SELECT * FROM LegalDocuments WHERE Context = @Context AND Active = 1", new { Context = context })).ToList(); }
    public async Task<LegalDocument?> GetByCodeAsync(string code) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<LegalDocument>("SELECT * FROM LegalDocuments WHERE Code = @Code AND Active = 1", new { Code = code }); }
}

public class UserAcceptanceRepository : IUserAcceptanceRepository
{
    private readonly IDbConnectionFactory _factory;
    public UserAcceptanceRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<int> CreateAsync(UserAcceptance a) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO UserConsentAudit (UserId, DocumentCode, DocumentVersion, ConsentContext, AcceptedAt, IpAddress, UserAgent) VALUES (@UserId, @DocumentCode, @DocumentVersion, @ConsentContext, @AcceptedAt, @IpAddress, @UserAgent); SELECT CAST(SCOPE_IDENTITY() AS INT)", a); }
    public async Task<List<UserAcceptance>> GetByUserAsync(int userId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<UserAcceptance>("SELECT * FROM UserConsentAudit WHERE UserId = @UserId", new { UserId = userId })).ToList(); }
}

public class PushDeviceTokenRepository : IPushDeviceTokenRepository
{
    private readonly IDbConnectionFactory _factory;
    public PushDeviceTokenRepository(IDbConnectionFactory factory) => _factory = factory;
    
    public async Task<int> UpsertAsync(PushDeviceToken t) 
    { 
        using var db = _factory.CreateConnection(); 
        // First, deactivate old tokens for this device
        await db.ExecuteAsync(
            "UPDATE PushDeviceTokens SET Active = 0, UpdatedAt = GETUTCDATE() WHERE DeviceId = @DeviceId AND UserId = @UserId AND DeviceToken != @DeviceToken", 
            t); 
        // Then insert or update the current token
        var existing = await db.QueryFirstOrDefaultAsync<PushDeviceToken>(
            "SELECT * FROM PushDeviceTokens WHERE DeviceToken = @DeviceToken AND UserId = @UserId", 
            t);
        
        if (existing != null)
        {
            await db.ExecuteAsync(
                "UPDATE PushDeviceTokens SET Active = 1, UpdatedAt = GETUTCDATE() WHERE Id = @Id", 
                new { existing.Id });
            return existing.Id;
        }
        
        return await db.QuerySingleAsync<int>(
            "INSERT INTO PushDeviceTokens (UserId, DeviceToken, Provider, Platform, DeviceId, Active, CreatedAt, UpdatedAt) VALUES (@UserId, @DeviceToken, @Provider, @Platform, @DeviceId, @Active, @CreatedAt, @UpdatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", 
            t); 
    }
    
    public async Task RemoveByDeviceIdAsync(string deviceId) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("DELETE FROM PushDeviceTokens WHERE DeviceId = @DeviceId", new { DeviceId = deviceId }); }
    public async Task<List<PushDeviceToken>> GetByUserAsync(int userId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<PushDeviceToken>("SELECT * FROM PushDeviceTokens WHERE UserId = @UserId AND Active = 1", new { UserId = userId })).ToList(); }
    public async Task<List<PushDeviceToken>> GetAllActiveAsync() { using var db = _factory.CreateConnection(); return (await db.QueryAsync<PushDeviceToken>("SELECT * FROM PushDeviceTokens WHERE Active = 1")).ToList(); }
}

public class NpsFeedbackRepository : INpsFeedbackRepository
{
    private readonly IDbConnectionFactory _factory;
    public NpsFeedbackRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<bool> ShouldShowAsync(int userId) { using var db = _factory.CreateConnection(); var count = await db.QuerySingleAsync<int>("SELECT COUNT(*) FROM NpsFeedbacks WHERE UserId = @UserId", new { UserId = userId }); return count == 0; }
    public async Task<int> CreateAsync(NpsFeedback f) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO NpsFeedbacks (UserId, Score, Comment, CreatedAt) VALUES (@UserId, @Score, @Comment, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", f); }
}

public class CardRepository : ICardRepository
{
    private readonly IDbConnectionFactory _factory;
    public CardRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<Card>> GetByUserAsync(int userId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<Card>("SELECT * FROM Cards WHERE UserId = @UserId", new { UserId = userId })).ToList(); }
    public async Task<int> CreateAsync(Card c) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO Cards (UserId, AsaasCardId, LastFourDigits, Brand, IsDefault, CreatedAt) VALUES (@UserId, @AsaasCardId, @LastFourDigits, @Brand, @IsDefault, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", c); }
    public async Task DeleteAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("DELETE FROM Cards WHERE Id = @Id", new { Id = id }); }
    public async Task SetDefaultAsync(int userId, int cardId) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE Cards SET IsDefault = 0 WHERE UserId = @UserId; UPDATE Cards SET IsDefault = 1 WHERE Id = @CardId", new { UserId = userId, CardId = cardId }); }
}

public class SupportSettingRepository : ISupportSettingRepository
{
    private readonly IDbConnectionFactory _factory;
    public SupportSettingRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<string?> GetValueAsync(string code) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<string>("SELECT Value FROM SupportSettings WHERE Code = @Code AND Active = 1", new { Code = code }); }
    public async Task SetValueAsync(string code, string value) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("MERGE SupportSettings AS target USING (SELECT @Code AS Code) AS source ON target.Code = source.Code WHEN MATCHED THEN UPDATE SET Value = @Value, UpdatedAt = GETUTCDATE() WHEN NOT MATCHED THEN INSERT (Code, Value, UpdatedAt) VALUES (@Code, @Value, GETUTCDATE());", new { Code = code, Value = value }); }
    public async Task<Dictionary<string, string>> GetAllAsync() { using var db = _factory.CreateConnection(); var rows = await db.QueryAsync<SupportSetting>("SELECT Code, Value FROM SupportSettings WHERE Active = 1"); return rows.ToDictionary(r => r.Code, r => r.Value); }
}

public class AdicionalRepository : IAdicionalRepository
{
    private readonly IDbConnectionFactory _factory;
    public AdicionalRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<AdicionalServico>> GetByUnidadeAsync(int unidadeId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<AdicionalServico>("SELECT * FROM AdicionalServicos WHERE UnidadeId = @UnidadeId AND Active = 1", new { UnidadeId = unidadeId })).ToList(); }
    public async Task<List<AdicionalServico>> GetByIdsAsync(List<int> ids) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<AdicionalServico>("SELECT * FROM AdicionalServicos WHERE Id IN @Ids", new { Ids = ids })).ToList(); }
    public async Task<int> CreateAsync(AdicionalServico a) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO AdicionalServicos (UnidadeId, Nome, Preco, Active) VALUES (@UnidadeId, @Nome, @Preco, @Active); SELECT CAST(SCOPE_IDENTITY() AS INT)", a); }
    public async Task UpdateAsync(AdicionalServico a) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE AdicionalServicos SET Nome=@Nome, Preco=@Preco, Active=@Active WHERE Id=@Id", a); }
    public async Task DeleteAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE AdicionalServicos SET Active = 0 WHERE Id = @Id", new { Id = id }); }
}

public class EmailVerificationTokenRepository : IEmailVerificationTokenRepository
{
    private readonly IDbConnectionFactory _factory;
    public EmailVerificationTokenRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<int> CreateAsync(EmailVerificationToken t) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO EmailVerificationTokens (Email, Code, ExpiresAt, CreatedAt) VALUES (@Email, @Code, @ExpiresAt, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", t); }
    public async Task<EmailVerificationToken?> GetByCodeAsync(string email, string code) { using var db = _factory.CreateConnection(); return await db.QueryFirstOrDefaultAsync<EmailVerificationToken>("SELECT * FROM EmailVerificationTokens WHERE Email = @Email AND Code = @Code AND Used = 0 AND ExpiresAt > GETUTCDATE()", new { Email = email, Code = code }); }
    public async Task MarkUsedAsync(int id) { using var db = _factory.CreateConnection(); await db.ExecuteAsync("UPDATE EmailVerificationTokens SET Used = 1 WHERE Id = @Id", new { Id = id }); }
}

public class AsaasPaymentRecordRepository : IAsaasPaymentRecordRepository
{
    private readonly IDbConnectionFactory _factory;
    public AsaasPaymentRecordRepository(IDbConnectionFactory factory) => _factory = factory;
    public async Task<List<AsaasPaymentRecord>> GetByAssinaturaAsync(int assinaturaId) { using var db = _factory.CreateConnection(); return (await db.QueryAsync<AsaasPaymentRecord>("SELECT * FROM AsaasPaymentRecords WHERE AssinaturaId = @AssinaturaId ORDER BY CreatedAt DESC", new { AssinaturaId = assinaturaId })).ToList(); }
    public async Task<(List<AsaasPaymentRecord> Items, int Total)> GetPagedAsync(int page, int pageSize, string? status) { using var db = _factory.CreateConnection(); var where = status != null ? "WHERE Status = @Status" : ""; var total = await db.QuerySingleAsync<int>($"SELECT COUNT(*) FROM AsaasPaymentRecords {where}", new { Status = status }); var items = (await db.QueryAsync<AsaasPaymentRecord>($"SELECT * FROM AsaasPaymentRecords {where} ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", new { Status = status, Offset = (page-1)*pageSize, PageSize = pageSize })).ToList(); return (items, total); }
    public async Task<int> CreateAsync(AsaasPaymentRecord r) { using var db = _factory.CreateConnection(); return await db.QuerySingleAsync<int>("INSERT INTO AsaasPaymentRecords (AssinaturaId, AsaasPaymentId, Status, Value, PaymentDate, CreatedAt) VALUES (@AssinaturaId, @AsaasPaymentId, @Status, @Value, @PaymentDate, @CreatedAt); SELECT CAST(SCOPE_IDENTITY() AS INT)", r); }
}

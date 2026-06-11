using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Infrastructure.Data;
using LavaMeuCarro.Infrastructure.Repositories;
using LavaMeuCarro.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace LavaMeuCarro.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=127.0.0.1,1433;Database=LavaMeuCarro;User Id=sa;Password=4uPYdPr0l6oYPAqUgMmRStdZCqFU;Encrypt=False;TrustServerCertificate=True;";

        services.AddSingleton<IDbConnectionFactory>(new SqlConnectionFactory(connectionString));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUnidadeRepository, UnidadeRepository>();
        services.AddScoped<IAgendamentoRepository, AgendamentoRepository>();
        services.AddScoped<IServicoRepository, ServicoRepository>();
        services.AddScoped<IFuncionarioRepository, FuncionarioRepository>();
        services.AddScoped<IVeiculoRepository, VeiculoRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<ICategoriaRepository, CategoriaRepository>();
        services.AddScoped<IAssinaturaRepository, AssinaturaRepository>();
        services.AddScoped<IPlanoRepository, PlanoRepository>();
        services.AddScoped<INotificacaoRepository, NotificacaoRepository>();
        services.AddScoped<IAvaliacaoRepository, AvaliacaoRepository>();
        services.AddScoped<ILegalDocumentRepository, LegalDocumentRepository>();
        services.AddScoped<IUserAcceptanceRepository, UserAcceptanceRepository>();
        services.AddScoped<IPushDeviceTokenRepository, PushDeviceTokenRepository>();
        services.AddScoped<INpsFeedbackRepository, NpsFeedbackRepository>();
        services.AddScoped<ICardRepository, CardRepository>();
        services.AddScoped<ISupportSettingRepository, SupportSettingRepository>();
        services.AddScoped<IAdicionalRepository, AdicionalRepository>();
        services.AddScoped<IEmailVerificationTokenRepository, EmailVerificationTokenRepository>();
        services.AddScoped<IPasswordResetCodeRepository, PasswordResetCodeRepository>();
        services.AddScoped<IAsaasPaymentRecordRepository, AsaasPaymentRecordRepository>();

        // Services
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddSingleton<IPushNotificationService, FirebasePushNotificationService>();
        
        // New Relic Telemetry (configured at runtime from database)
        services.AddHttpClient("NewRelicIngest");
        services.AddSingleton<INewRelicLogService, NewRelicLogService>();
        services.AddSingleton<IPostConfigureOptions<NewRelicOptions>, NewRelicOptionsPostConfigureOptions>();

        return services;
    }
}

using Dapper;
using HoraDaBeleza.Application.Interfaces;
using HoraDaBeleza.Domain.Enums;
using HoraDaBeleza.Domain.Entities;
using HoraDaBeleza.Infrastructure.Data;

namespace HoraDaBeleza.Infrastructure.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly IDbConnectionFactory _db;
    public SubscriptionRepository(IDbConnectionFactory db) => _db = db;

    public async Task<Subscription?> GetActiveByUserAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Subscription>(
            @"SELECT TOP 1 *
              FROM Subscriptions
              WHERE UserId=@UserId AND Status=@ActiveStatus
              ORDER BY CreatedAt DESC, Id DESC",
            new { UserId = userId, ActiveStatus = (int)SubscriptionStatus.Active });
    }

    public async Task<bool> HasUsedTrialOrStarterAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteScalarAsync<bool>(
            @"SELECT CASE WHEN EXISTS (
                    SELECT 1
                    FROM Subscriptions s
                    INNER JOIN Plans p ON p.Id = s.PlanId
                    WHERE s.UserId = @UserId
                      AND (
                          p.PlanType = @TrialPlanType
                          OR p.Price = 0
                          OR LOWER(p.Name) LIKE '%starter%'
                          OR LOWER(p.Name) LIKE '%trial%'
                          OR LOWER(p.Name) LIKE '%free%'
                      )
                ) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END",
            new
            {
                UserId = userId,
                TrialPlanType = (int)PlanType.Trial
            });
    }

    public async Task CancelActiveByUserAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE Subscriptions
              SET Status=@CancelledStatus
              WHERE UserId=@UserId AND Status=@ActiveStatus",
            new
            {
                UserId = userId,
                ActiveStatus = (int)SubscriptionStatus.Active,
                CancelledStatus = (int)SubscriptionStatus.Cancelled
            });
    }

    public async Task<int> CreateAsync(Subscription subscription)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            INSERT INTO Subscriptions (UserId,PlanId,Status,StartDate,EndDate,CreatedAt,TrialStartDate,TrialEndDate,CurrentClients,NextBillingDate,PaymentFailedAt,AsaasSubscriptionId)
            VALUES (@UserId,@PlanId,@Status,@StartDate,@EndDate,@CreatedAt,@TrialStartDate,@TrialEndDate,@CurrentClients,@NextBillingDate,@PaymentFailedAt,@AsaasSubscriptionId);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";
        return await conn.QuerySingleAsync<int>(sql, subscription);
    }

    public async Task UpdateAsync(Subscription subscription)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE Subscriptions 
              SET Status=@Status, TrialStartDate=@TrialStartDate, TrialEndDate=@TrialEndDate, 
                  CurrentClients=@CurrentClients, NextBillingDate=@NextBillingDate,
                  PaymentFailedAt=@PaymentFailedAt, AsaasSubscriptionId=@AsaasSubscriptionId
              WHERE Id=@Id",
            subscription);
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("DELETE FROM Subscriptions WHERE Id=@Id", new { Id = id });
    }

    public async Task<IReadOnlyList<Subscription>> GetSubscriptionsDueForBillingAsync(CancellationToken ct = default)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT s.*
            FROM Subscriptions s
            INNER JOIN Plans p ON p.Id = s.PlanId
            WHERE s.Status = @ActiveStatus
              AND p.Price > 0
              AND s.NextBillingDate IS NOT NULL
              AND CAST(s.NextBillingDate AS DATE) <= CAST(GETUTCDATE() AS DATE)
              AND (s.PaymentFailedAt IS NULL)
            ORDER BY s.NextBillingDate";
        var result = await conn.QueryAsync<Subscription>(sql, new { ActiveStatus = (int)SubscriptionStatus.Active });
        return result.ToList();
    }

    public async Task<IReadOnlyList<Subscription>> GetSubscriptionsWithExpiredGracePeriodAsync(
        int gracePeriodHours = 24, CancellationToken ct = default)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT *
            FROM Subscriptions
            WHERE Status = @FailedStatus
              AND PaymentFailedAt IS NOT NULL
              AND PaymentFailedAt <= DATEADD(HOUR, @NegativeHours, GETUTCDATE())";
        var result = await conn.QueryAsync<Subscription>(sql, new
        {
            FailedStatus   = (int)SubscriptionStatus.PaymentFailed,
            NegativeHours  = -gracePeriodHours
        });
        return result.ToList();
    }

    public async Task<IReadOnlyList<Subscription>> GetTrialSubscriptionsNearExpiryAsync(
        int daysBeforeExpiry, CancellationToken ct = default)
    {
        using var conn = _db.CreateConnection();
        // Retorna subscriptions onde TrialEndDate cai no intervalo do dia alvo (UTC)
        const string sql = @"
            SELECT s.*
            FROM Subscriptions s
            INNER JOIN Plans p ON p.Id = s.PlanId
            WHERE s.Status = @ActiveStatus
              AND (p.PlanType = @TrialType OR p.Price = 0)
              AND s.TrialEndDate IS NOT NULL
              AND CAST(s.TrialEndDate AS DATE) = CAST(DATEADD(DAY, @DaysBefore, GETUTCDATE()) AS DATE)";
        var result = await conn.QueryAsync<Subscription>(sql, new
        {
            ActiveStatus = (int)SubscriptionStatus.Active,
            TrialType    = (int)Domain.Enums.PlanType.Trial,
            DaysBefore   = daysBeforeExpiry
        });
        return result.ToList();
    }
}

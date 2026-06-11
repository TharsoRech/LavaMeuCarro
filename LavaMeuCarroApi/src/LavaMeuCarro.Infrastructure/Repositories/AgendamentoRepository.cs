using Dapper;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.Infrastructure.Repositories;

public class AgendamentoRepository : IAgendamentoRepository
{
    private readonly IDbConnectionFactory _factory;
    public AgendamentoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Agendamento?> GetByIdAsync(int id)
    {
        using var db = _factory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<Agendamento>("SELECT * FROM Agendamentos WHERE Id = @Id", new { Id = id });
    }

    public async Task<List<Agendamento>> GetByClientAsync(int clientId)
    {
        using var db = _factory.CreateConnection();
        return (await db.QueryAsync<Agendamento>("SELECT * FROM Agendamentos WHERE ClientId = @ClientId ORDER BY ScheduledAt DESC", new { ClientId = clientId })).ToList();
    }

    public async Task<List<Agendamento>> GetByUnidadeAsync(int unidadeId, DateTime? date, int? funcionarioId)
    {
        using var db = _factory.CreateConnection();
        var sql = "SELECT * FROM Agendamentos WHERE UnidadeId = @UnidadeId AND (@Date IS NULL OR CAST(ScheduledAt AS DATE) = @Date) AND (@FuncionarioId IS NULL OR FuncionarioId = @FuncionarioId) ORDER BY ScheduledAt";
        return (await db.QueryAsync<Agendamento>(sql, new { UnidadeId = unidadeId, Date = date?.Date, FuncionarioId = funcionarioId })).ToList();
    }

    public async Task<List<Agendamento>> GetByFuncionarioAsync(int funcionarioId, DateTime? date)
    {
        using var db = _factory.CreateConnection();
        return (await db.QueryAsync<Agendamento>("SELECT * FROM Agendamentos WHERE FuncionarioId = @FuncionarioId AND (@Date IS NULL OR CAST(ScheduledAt AS DATE) = @Date) ORDER BY ScheduledAt", new { FuncionarioId = funcionarioId, Date = date?.Date })).ToList();
    }

    public async Task<List<Agendamento>> GetByStatusAsync(AgendamentoStatus status, int userId)
    {
        using var db = _factory.CreateConnection();
        return (await db.QueryAsync<Agendamento>("SELECT * FROM Agendamentos WHERE Status = @Status AND (ClientId = @UserId OR FuncionarioId = @UserId) ORDER BY ScheduledAt DESC", new { Status = status, UserId = userId })).ToList();
    }

    public async Task<int> CreateAsync(Agendamento agendamento)
    {
        using var db = _factory.CreateConnection();
        var sql = @"INSERT INTO Agendamentos (ClientId, FuncionarioId, ServicoId, UnidadeId, VeiculoId, ScheduledAt, DurationMinutes, TotalPrice, Status, Modalidade, TaxaDeslocamento, PrecoBruto, Desconto, PrecoAdicionais, Notes, CreatedAt)
                    VALUES (@ClientId, @FuncionarioId, @ServicoId, @UnidadeId, @VeiculoId, @ScheduledAt, @DurationMinutes, @TotalPrice, @Status, @Modalidade, @TaxaDeslocamento, @PrecoBruto, @Desconto, @PrecoAdicionais, @Notes, @CreatedAt);
                    SELECT CAST(SCOPE_IDENTITY() AS INT)";
        return await db.QuerySingleAsync<int>(sql, agendamento);
    }

    public async Task UpdateAsync(Agendamento agendamento)
    {
        using var db = _factory.CreateConnection();
        var sql = @"UPDATE Agendamentos SET Status=@Status, CancellationReason=@CancellationReason, VistoriaFotos=@VistoriaFotos, VistoriaObservacoes=@VistoriaObservacoes, VistoriaData=@VistoriaData, RetiradoPor=@RetiradoPor, NomeAutorizado=@NomeAutorizado, DocumentoAutorizado=@DocumentoAutorizado, RetiradaEm=@RetiradaEm, UpdatedAt=@UpdatedAt WHERE Id=@Id";
        await db.ExecuteAsync(sql, agendamento);
    }

    public async Task<bool> HasConflictAsync(int unidadeId, DateTime inicio, DateTime fim, int? excludeId)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT COUNT(*) FROM Agendamentos WHERE UnidadeId = @UnidadeId AND ScheduledAt < @Fim AND DATEADD(MINUTE, DurationMinutes, ScheduledAt) > @Inicio AND Status NOT IN (3, 5) AND (@ExcludeId IS NULL OR Id <> @ExcludeId)";
        return await db.QuerySingleAsync<int>(sql, new { UnidadeId = unidadeId, Inicio = inicio, Fim = fim, ExcludeId = excludeId }) > 0;
    }

    public async Task<int> CountByOwnerInMonthAsync(int ownerId, int month, int year)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT COUNT(*) FROM Agendamentos a INNER JOIN Unidades u ON a.UnidadeId = u.Id WHERE u.OwnerId = @OwnerId AND MONTH(a.ScheduledAt) = @Month AND YEAR(a.ScheduledAt) = @Year AND a.Status NOT IN (3, 5)";
        return await db.QuerySingleAsync<int>(sql, new { OwnerId = ownerId, Month = month, Year = year });
    }

    public async Task<int> CountByStatusAsync(int unidadeId, AgendamentoStatus status, DateTime? from, DateTime? to)
    {
        using var db = _factory.CreateConnection();
        var sql = "SELECT COUNT(*) FROM Agendamentos WHERE UnidadeId = @UnidadeId AND Status = @Status AND (@From IS NULL OR ScheduledAt >= @From) AND (@To IS NULL OR ScheduledAt < @To)";
        return await db.QuerySingleAsync<int>(sql, new { UnidadeId = unidadeId, Status = status, From = from, To = to });
    }

    public async Task<decimal> SumByUnidadeAsync(int unidadeId, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = "SELECT ISNULL(SUM(TotalPrice), 0) FROM Agendamentos WHERE UnidadeId = @UnidadeId AND Status = 4 AND ScheduledAt >= @From AND ScheduledAt < @To";
        return await db.QuerySingleAsync<decimal>(sql, new { UnidadeId = unidadeId, From = from, To = to });
    }

    public async Task<(List<Agendamento> Items, int Total)> GetPagedAsync(int unidadeId, int page, int pageSize, string? search, AgendamentoStatus? status)
    {
        using var db = _factory.CreateConnection();
        var where = "WHERE a.UnidadeId = @UnidadeId AND (@Status IS NULL OR a.Status = @Status)";
        var countSql = $"SELECT COUNT(*) FROM Agendamentos a {where}";
        var total = await db.QuerySingleAsync<int>(countSql, new { UnidadeId = unidadeId, Status = status });
        var sql = $"SELECT a.* FROM Agendamentos a {where} ORDER BY a.ScheduledAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
        var items = (await db.QueryAsync<Agendamento>(sql, new { UnidadeId = unidadeId, Status = status, Offset = (page - 1) * pageSize, PageSize = pageSize })).ToList();
        return (items, total);
    }

    public async Task<List<dynamic>> GetDailyCountsAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = "SELECT CAST(ScheduledAt AS DATE) AS Date, COUNT(*) AS Count FROM Agendamentos WHERE UnidadeId IN @UnidadeIds AND ScheduledAt >= @From AND ScheduledAt < @To GROUP BY CAST(ScheduledAt AS DATE) ORDER BY Date";
        var result = await db.QueryAsync(sql, new { UnidadeIds = unidadeIds, From = from, To = to });
        return result.Select(r => (dynamic)new { Date = (DateTime)r.Date, Count = (int)r.Count }).ToList();
    }

    public async Task<List<dynamic>> GetRevenueByDateAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = "SELECT CAST(ScheduledAt AS DATE) AS Date, SUM(TotalPrice) AS Revenue FROM Agendamentos WHERE UnidadeId IN @UnidadeIds AND Status = 4 AND ScheduledAt >= @From AND ScheduledAt < @To GROUP BY CAST(ScheduledAt AS DATE) ORDER BY Date";
        var result = await db.QueryAsync(sql, new { UnidadeIds = unidadeIds, From = from, To = to });
        return result.Select(r => (dynamic)new { Date = (DateTime)r.Date, Revenue = (decimal)r.Revenue }).ToList();
    }

    public async Task<List<dynamic>> GetServiceRankingAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT s.Name, COUNT(*) AS Count, SUM(a.TotalPrice) AS Revenue, 
                    AVG(a.TotalPrice) AS AverageTicket,
                    CAST(COUNT(*) AS FLOAT) / NULLIF((SELECT COUNT(*) FROM Agendamentos WHERE UnidadeId IN @UnidadeIds AND ScheduledAt >= @From AND ScheduledAt < @To), 0) AS Share
                    FROM Agendamentos a INNER JOIN Servicos s ON a.ServicoId = s.Id
                    WHERE a.UnidadeId IN @UnidadeIds AND a.ScheduledAt >= @From AND a.ScheduledAt < @To
                    GROUP BY s.Name ORDER BY Revenue DESC";
        var result = await db.QueryAsync(sql, new { UnidadeIds = unidadeIds, From = from, To = to });
        return result.Select(r => (dynamic)new { Name = (string)r.Name, Count = (int)r.Count, Revenue = (decimal)r.Revenue, AverageTicket = (decimal)r.AverageTicket, Share = (double)r.Share }).ToList();
    }

    public async Task<List<dynamic>> GetProfessionalRankingAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT u.Name, COUNT(*) AS Count, SUM(a.TotalPrice) AS Revenue
                    FROM Agendamentos a INNER JOIN Funcionarios f ON a.FuncionarioId = f.Id INNER JOIN Users u ON f.UserId = u.Id
                    WHERE a.UnidadeId IN @UnidadeIds AND a.ScheduledAt >= @From AND a.ScheduledAt < @To
                    GROUP BY f.Id, u.Name ORDER BY Revenue DESC";
        var result = await db.QueryAsync(sql, new { UnidadeIds = unidadeIds, From = from, To = to });
        return result.Select(r => (dynamic)new { Name = (string)r.Name, Count = (int)r.Count, Revenue = (decimal)r.Revenue }).ToList();
    }

    public async Task<List<dynamic>> GetClientRankingAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT u.Name, COUNT(*) AS Visits, SUM(a.TotalPrice) AS Revenue, MAX(a.ScheduledAt) AS LastVisit
                    FROM Agendamentos a INNER JOIN Users u ON a.ClientId = u.Id
                    WHERE a.UnidadeId IN @UnidadeIds AND a.ScheduledAt >= @From AND a.ScheduledAt < @To
                    GROUP BY a.ClientId, u.Name ORDER BY Revenue DESC";
        var result = await db.QueryAsync(sql, new { UnidadeIds = unidadeIds, From = from, To = to });
        return result.Select(r => (dynamic)new { Name = (string)r.Name, Visits = (int)r.Visits, Revenue = (decimal)r.Revenue, LastVisit = (DateTime)r.LastVisit }).ToList();
    }

    public async Task<List<dynamic>> GetWeekdayDemandAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT DATENAME(dw, ScheduledAt) AS Day, COUNT(*) AS Count
                    FROM Agendamentos WHERE UnidadeId IN @UnidadeIds AND ScheduledAt >= @From AND ScheduledAt < @To
                    GROUP BY DATENAME(dw, ScheduledAt), DATEPART(dw, ScheduledAt) ORDER BY DATEPART(dw, ScheduledAt)";
        var result = await db.QueryAsync(sql, new { UnidadeIds = unidadeIds, From = from, To = to });
        return result.Select(r => (dynamic)new { Day = (string)r.Day, Count = (int)r.Count }).ToList();
    }

    public async Task<List<dynamic>> GetHourlyDemandAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        var sql = @"SELECT DATEPART(hour, ScheduledAt) AS Hour, COUNT(*) AS Count
                    FROM Agendamentos WHERE UnidadeId IN @UnidadeIds AND ScheduledAt >= @From AND ScheduledAt < @To
                    GROUP BY DATEPART(hour, ScheduledAt) ORDER BY DATEPART(hour, ScheduledAt)";
        var result = await db.QueryAsync(sql, new { UnidadeIds = unidadeIds, From = from, To = to });
        return result.Select(r => (dynamic)new { Hour = (int)r.Hour, Count = (int)r.Count }).ToList();
    }

    public async Task<int> CountUniqueClientsAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        return await db.QuerySingleAsync<int>("SELECT COUNT(DISTINCT ClientId) FROM Agendamentos WHERE UnidadeId IN @UnidadeIds AND ScheduledAt >= @From AND ScheduledAt < @To", new { UnidadeIds = unidadeIds, From = from, To = to });
    }

    public async Task<int> CountNoShowAsync(int[] unidadeIds, DateTime from, DateTime to)
    {
        using var db = _factory.CreateConnection();
        return await db.QuerySingleAsync<int>("SELECT COUNT(*) FROM Agendamentos WHERE UnidadeId IN @UnidadeIds AND Status = 5 AND ScheduledAt >= @From AND ScheduledAt < @To", new { UnidadeIds = unidadeIds, From = from, To = to });
    }

    public async Task<int> CountProfessionalsAsync(int[] unidadeIds)
    {
        using var db = _factory.CreateConnection();
        return await db.QuerySingleAsync<int>("SELECT COUNT(DISTINCT FuncionarioId) FROM Agendamentos WHERE UnidadeId IN @UnidadeIds", new { UnidadeIds = unidadeIds });
    }

    public async Task<int> CountServicesAsync(int[] unidadeIds)
    {
        using var db = _factory.CreateConnection();
        return await db.QuerySingleAsync<int>("SELECT COUNT(DISTINCT ServicoId) FROM Agendamentos WHERE UnidadeId IN @UnidadeIds", new { UnidadeIds = unidadeIds });
    }
}

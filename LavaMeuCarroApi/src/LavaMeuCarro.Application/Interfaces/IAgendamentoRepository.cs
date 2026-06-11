using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.Application.Interfaces;

public interface IAgendamentoRepository
{
    Task<Agendamento?> GetByIdAsync(int id);
    Task<List<Agendamento>> GetByClientAsync(int clientId);
    Task<List<Agendamento>> GetByUnidadeAsync(int unidadeId, DateTime? date, int? funcionarioId);
    Task<List<Agendamento>> GetByFuncionarioAsync(int funcionarioId, DateTime? date);
    Task<List<Agendamento>> GetByStatusAsync(AgendamentoStatus status, int userId);
    Task<int> CreateAsync(Agendamento agendamento);
    Task UpdateAsync(Agendamento agendamento);
    Task<bool> HasConflictAsync(int unidadeId, DateTime inicio, DateTime fim, int? excludeId);
    Task<int> CountByOwnerInMonthAsync(int ownerId, int month, int year);
    Task<int> CountByStatusAsync(int unidadeId, AgendamentoStatus status, DateTime? from, DateTime? to);
    Task<decimal> SumByUnidadeAsync(int unidadeId, DateTime from, DateTime to);
    Task<(List<Agendamento> Items, int Total)> GetPagedAsync(int unidadeId, int page, int pageSize, string? search, AgendamentoStatus? status);
    Task<List<dynamic>> GetDailyCountsAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<List<dynamic>> GetRevenueByDateAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<List<dynamic>> GetServiceRankingAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<List<dynamic>> GetProfessionalRankingAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<List<dynamic>> GetClientRankingAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<List<dynamic>> GetWeekdayDemandAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<List<dynamic>> GetHourlyDemandAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<int> CountUniqueClientsAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<int> CountNoShowAsync(int[] unidadeIds, DateTime from, DateTime to);
    Task<int> CountProfessionalsAsync(int[] unidadeIds);
    Task<int> CountServicesAsync(int[] unidadeIds);
}

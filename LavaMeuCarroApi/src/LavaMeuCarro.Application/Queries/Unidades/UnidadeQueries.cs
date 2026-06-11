using MediatR;
using LavaMeuCarro.Application.DTOs;

namespace LavaMeuCarro.Application.Queries.Unidades;

public record GetAllUnidadesQuery(string? City, string? Search) : IRequest<List<UnidadeDTO>>;
public record GetPagedUnidadesQuery(int Page, int PageSize, string? City, string? Search) : IRequest<(List<UnidadeDTO> Items, int Total)>;
public record GetUnidadeByIdQuery(int Id) : IRequest<UnidadeDTO>;
public record GetMyUnidadesQuery(int OwnerId) : IRequest<List<UnidadeDTO>>;
public record GetPopularUnidadesQuery(int Limit) : IRequest<List<UnidadeDTO>>;

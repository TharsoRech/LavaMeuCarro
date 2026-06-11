using MediatR;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Exceptions;

namespace LavaMeuCarro.Application.Queries.Unidades;

public class GetAllUnidadesHandler : IRequestHandler<GetAllUnidadesQuery, List<UnidadeDTO>>
{
    private readonly IUnidadeRepository _repo;
    public GetAllUnidadesHandler(IUnidadeRepository repo) => _repo = repo;
    public async Task<List<UnidadeDTO>> Handle(GetAllUnidadesQuery cmd, CancellationToken ct)
        => (await _repo.GetAllAsync(cmd.City, cmd.Search)).Select(Map).ToList();
    private static UnidadeDTO Map(Unidade u) => new(u.Id, u.OwnerId, u.Name, u.Description, u.LogoUrl, u.Address, u.Number, u.Complement, u.Neighborhood, u.ReferencePoint, u.City, u.State, u.ZipCode, u.Latitude, u.Longitude, u.Phone, u.Email, u.BusinessHours, u.Active, u.Published, u.Rating, u.Reviews, u.Gallery, u.AverageRating, u.WhatsApp, u.InstagramUrl, u.SchedulingTimeOptions, u.SchedulingTimeInterval, u.OfereceLevaTraz, u.RaioMaximoKm, u.TipoTaxaDeslocamento, u.TaxaDeslocamento, u.CreatedAt);
}

public class GetPagedUnidadesHandler : IRequestHandler<GetPagedUnidadesQuery, (List<UnidadeDTO> Items, int Total)>
{
    private readonly IUnidadeRepository _repo;
    public GetPagedUnidadesHandler(IUnidadeRepository repo) => _repo = repo;
    public async Task<(List<UnidadeDTO> Items, int Total)> Handle(GetPagedUnidadesQuery cmd, CancellationToken ct)
    {
        var (items, total) = await _repo.GetPagedAsync(cmd.Page, cmd.PageSize, cmd.City, cmd.Search);
        var dtos = items.Select(u => new UnidadeDTO(u.Id, u.OwnerId, u.Name, u.Description, u.LogoUrl, u.Address, u.Number, u.Complement, u.Neighborhood, u.ReferencePoint, u.City, u.State, u.ZipCode, u.Latitude, u.Longitude, u.Phone, u.Email, u.BusinessHours, u.Active, u.Published, u.Rating, u.Reviews, u.Gallery, u.AverageRating, u.WhatsApp, u.InstagramUrl, u.SchedulingTimeOptions, u.SchedulingTimeInterval, u.OfereceLevaTraz, u.RaioMaximoKm, u.TipoTaxaDeslocamento, u.TaxaDeslocamento, u.CreatedAt)).ToList();
        return (dtos, total);
    }
}

public class GetUnidadeByIdHandler : IRequestHandler<GetUnidadeByIdQuery, UnidadeDTO>
{
    private readonly IUnidadeRepository _repo;
    public GetUnidadeByIdHandler(IUnidadeRepository repo) => _repo = repo;
    public async Task<UnidadeDTO> Handle(GetUnidadeByIdQuery cmd, CancellationToken ct)
    {
        var u = await _repo.GetByIdAsync(cmd.Id) ?? throw new NotFoundException("Unidade not found");
        return new UnidadeDTO(u.Id, u.OwnerId, u.Name, u.Description, u.LogoUrl, u.Address, u.Number, u.Complement, u.Neighborhood, u.ReferencePoint, u.City, u.State, u.ZipCode, u.Latitude, u.Longitude, u.Phone, u.Email, u.BusinessHours, u.Active, u.Published, u.Rating, u.Reviews, u.Gallery, u.AverageRating, u.WhatsApp, u.InstagramUrl, u.SchedulingTimeOptions, u.SchedulingTimeInterval, u.OfereceLevaTraz, u.RaioMaximoKm, u.TipoTaxaDeslocamento, u.TaxaDeslocamento, u.CreatedAt);
    }
}

public class GetMyUnidadesHandler : IRequestHandler<GetMyUnidadesQuery, List<UnidadeDTO>>
{
    private readonly IUnidadeRepository _repo;
    public GetMyUnidadesHandler(IUnidadeRepository repo) => _repo = repo;
    public async Task<List<UnidadeDTO>> Handle(GetMyUnidadesQuery cmd, CancellationToken ct)
        => (await _repo.GetByOwnerAsync(cmd.OwnerId)).Select(u => new UnidadeDTO(u.Id, u.OwnerId, u.Name, u.Description, u.LogoUrl, u.Address, u.Number, u.Complement, u.Neighborhood, u.ReferencePoint, u.City, u.State, u.ZipCode, u.Latitude, u.Longitude, u.Phone, u.Email, u.BusinessHours, u.Active, u.Published, u.Rating, u.Reviews, u.Gallery, u.AverageRating, u.WhatsApp, u.InstagramUrl, u.SchedulingTimeOptions, u.SchedulingTimeInterval, u.OfereceLevaTraz, u.RaioMaximoKm, u.TipoTaxaDeslocamento, u.TaxaDeslocamento, u.CreatedAt)).ToList();
}

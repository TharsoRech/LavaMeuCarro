using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Exceptions;
using Dapper;
using LavaMeuCarro.Infrastructure.Data;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/veiculos")]
public class VeiculosController : ControllerBase
{
    private readonly IVeiculoRepository _repo;
    private readonly IDbConnectionFactory _dbFactory;
    public VeiculosController(IVeiculoRepository repo, IDbConnectionFactory dbFactory)
    {
        _repo = repo;
        _dbFactory = dbFactory;
    }

    private int UserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<VeiculoDTO>>> GetMine()
    {
        var veiculos = await _repo.GetByClientAsync(UserId);
        return Ok(veiculos.Select(v => new VeiculoDTO(v.Id, v.ClientId, v.Placa, v.Marca, v.Modelo, v.Cor, v.Tamanho, v.Ano, v.FotoBase64, v.CreatedAt)));
    }

    [HttpGet("admin/by-unidade/{unidadeId}")]
    [Authorize]
    public async Task<ActionResult<List<VeiculoAdminDTO>>> GetByUnidade(int unidadeId)
    {
        var veiculos = await _repo.GetByUnidadeAsync(unidadeId);
        return Ok(veiculos.Select(v => new VeiculoAdminDTO(v.Id, v.ClientId, v.Placa, v.Marca, v.Modelo, v.Cor, v.Tamanho, v.Ano, v.FotoBase64, v.CreatedAt, v.ClientName, v.ClientPhone)));
    }

    [HttpGet("{id}/admin")]
    [Authorize]
    public async Task<ActionResult<VeiculoAdminDTO>> GetByIdAdmin(int id)
    {
        var veiculo = await _repo.GetByIdWithClientAsync(id) ?? throw new NotFoundException("Vehicle not found");
        return Ok(new VeiculoAdminDTO(veiculo.Id, veiculo.ClientId, veiculo.Placa, veiculo.Marca, veiculo.Modelo, veiculo.Cor, veiculo.Tamanho, veiculo.Ano, veiculo.FotoBase64, veiculo.CreatedAt, veiculo.ClientName, veiculo.ClientPhone));
    }

    [HttpGet("{id}/appointments")]
    [Authorize]
    public async Task<ActionResult<List<VehicleAppointmentDTO>>> GetVehicleAppointments(int id, [FromQuery] int unidadeId)
    {
        using var db = _dbFactory.CreateConnection();
        var sql = @"
            SELECT a.Id,
                   a.ScheduledAt,
                   a.Status,
                   s.Name AS ServiceName,
                   u2.Name AS ProfessionalName,
                   a.TotalPrice,
                   a.DurationMinutes
            FROM Agendamentos a
            LEFT JOIN Servicos s ON s.Id = a.ServicoId
            LEFT JOIN Funcionarios f ON f.Id = a.FuncionarioId
            LEFT JOIN Users u2 ON u2.Id = f.UserId
            WHERE a.VeiculoId = @Id AND a.UnidadeId = @UnidadeId
            ORDER BY a.ScheduledAt DESC";
        var items = await db.QueryAsync<VehicleAppointmentDTO>(sql, new { Id = id, UnidadeId = unidadeId });
        return Ok(items.ToList());
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<int>> Create([FromBody] CreateVeiculoRequest request)
    {
        var placa = request.Placa.ToUpper().Replace("-", "").Trim();
        var existing = await _repo.GetByPlacaAsync(placa);
        if (existing != null && existing.ClientId != UserId)
            throw new ConflictException("Plate already registered");

        var veiculo = new Veiculo { ClientId = UserId, Placa = placa, Marca = request.Marca, Modelo = request.Modelo, Cor = request.Cor, Tamanho = request.Tamanho, Ano = request.Ano, FotoBase64 = request.FotoBase64 };
        return Ok(await _repo.CreateAsync(veiculo));
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateVeiculoRequest request)
    {
        var veiculo = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("Vehicle not found");
        if (veiculo.ClientId != UserId) throw new ForbiddenException("Not your vehicle");
        if (request.Marca != null) veiculo.Marca = request.Marca;
        if (request.Modelo != null) veiculo.Modelo = request.Modelo;
        if (request.Cor != null) veiculo.Cor = request.Cor;
        if (request.Tamanho != null) veiculo.Tamanho = request.Tamanho;
        if (request.Ano != null) veiculo.Ano = request.Ano;
        if (request.FotoBase64 != null) veiculo.FotoBase64 = request.FotoBase64;
        if (request.Placa != null) veiculo.Placa = request.Placa.ToUpper().Replace("-", "").Trim();
        await _repo.UpdateAsync(veiculo);
        return Ok();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        var veiculo = await _repo.GetByIdAsync(id) ?? throw new NotFoundException("Vehicle not found");
        if (veiculo.ClientId != UserId) throw new ForbiddenException("Not your vehicle");
        await _repo.DeleteAsync(id);
        return Ok();
    }
}

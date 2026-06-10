using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Exceptions;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/veiculos")]
public class VeiculosController : ControllerBase
{
    private readonly IVeiculoRepository _repo;
    public VeiculosController(IVeiculoRepository repo) => _repo = repo;

    private int UserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<VeiculoDTO>>> GetMine()
    {
        var veiculos = await _repo.GetByClientAsync(UserId);
        return Ok(veiculos.Select(v => new VeiculoDTO(v.Id, v.ClientId, v.Placa, v.Marca, v.Modelo, v.Cor, v.Tamanho, v.CreatedAt)));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<int>> Create([FromBody] CreateVeiculoRequest request)
    {
        var placa = request.Placa.ToUpper().Replace("-", "").Trim();
        var existing = await _repo.GetByPlacaAsync(placa);
        if (existing != null && existing.ClientId != UserId)
            throw new ConflictException("Plate already registered");

        var veiculo = new Veiculo { ClientId = UserId, Placa = placa, Marca = request.Marca, Modelo = request.Modelo, Cor = request.Cor, Tamanho = request.Tamanho };
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

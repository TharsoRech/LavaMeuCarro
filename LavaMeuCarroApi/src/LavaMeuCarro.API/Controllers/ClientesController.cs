using LavaMeuCarro.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly IUserRepository _userRepo;

    public ClientesController(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    /// <summary>
    /// Lista todos os clientes (usuários do tipo Client)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var userId = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var clients = await _userRepo.GetClientsAsync(page, pageSize, search);
        return Ok(clients);
    }

    /// <summary>
    /// Busca clientes por termo (nome, email, telefone, documento)
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult> Search([FromQuery] string search)
    {
        var userId = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(search) || search.Length < 2)
            return BadRequest("Termo de busca deve ter pelo menos 2 caracteres");

        var clients = await _userRepo.SearchClientsAsync(search);
        return Ok(clients);
    }

    /// <summary>
    /// Obtém detalhes de um cliente específico
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var userId = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var client = await _userRepo.GetByIdAsync(id);
        if (client == null)
            return NotFound("Cliente não encontrado");

        if (client.Type != Domain.Enums.UserType.Client)
            return BadRequest("Usuário não é um cliente");

        return Ok(new
        {
            client.Id,
            client.Name,
            client.Email,
            client.Phone,
            client.Doc,
            client.Dob,
            client.Username,
            client.Country,
            client.Active,
            client.CreatedAt
        });
    }

    /// <summary>
    /// Cria um novo cliente
    /// </summary>
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateClientRequest request)
    {
        var userId = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // Verifica se email já existe
        var existingUser = await _userRepo.GetByEmailAsync(request.Email);
        if (existingUser != null)
            return BadRequest("Email já cadastrado");

        var newUser = new Domain.Entities.User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password ?? "123456"), // Senha padrão se não fornecida
            Phone = request.Phone,
            Doc = request.Doc,
            Dob = request.Dob,
            Type = Domain.Enums.UserType.Client,
            Active = true,
            CreatedAt = DateTime.UtcNow
        };

        var createdUserId = await _userRepo.CreateAsync(newUser);
        
        return CreatedAtAction(nameof(GetById), new { id = createdUserId }, new
        {
            Id = createdUserId,
            newUser.Name,
            newUser.Email,
            newUser.Phone,
            newUser.Doc
        });
    }

    /// <summary>
    /// Atualiza dados de um cliente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateClientRequest request)
    {
        var userId = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var client = await _userRepo.GetByIdAsync(id);
        if (client == null)
            return NotFound("Cliente não encontrado");

        if (client.Type != Domain.Enums.UserType.Client)
            return BadRequest("Usuário não é um cliente");

        client.Name = request.Name ?? client.Name;
        client.Phone = request.Phone ?? client.Phone;
        client.Doc = request.Doc ?? client.Doc;
        client.Dob = request.Dob ?? client.Dob;
        client.UpdatedAt = DateTime.UtcNow;

        await _userRepo.UpdateAsync(client);

        return Ok(new
        {
            client.Id,
            client.Name,
            client.Email,
            client.Phone,
            client.Doc
        });
    }

    /// <summary>
    /// Desativa um cliente (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var userId = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var client = await _userRepo.GetByIdAsync(id);
        if (client == null)
            return NotFound("Cliente não encontrado");

        if (client.Type != Domain.Enums.UserType.Client)
            return BadRequest("Usuário não é um cliente");

        client.Active = false;
        client.UpdatedAt = DateTime.UtcNow;

        await _userRepo.UpdateAsync(client);

        return NoContent();
    }
}

public class CreateClientRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? Phone { get; set; }
    public string? Doc { get; set; }
    public DateTime? Dob { get; set; }
}

public class UpdateClientRequest
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Doc { get; set; }
    public DateTime? Dob { get; set; }
}

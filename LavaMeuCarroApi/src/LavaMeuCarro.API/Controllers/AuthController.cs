using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Commands.Auth;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Queries.Auth;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        => Ok(await _mediator.Send(new LoginCommand(request)));

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
        => Ok(await _mediator.Send(new RegisterCommand(request)));

    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshResponse>> Refresh([FromBody] RefreshRequest request)
        => Ok(await _mediator.Send(new RefreshCommand(request)));

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        await _mediator.Send(new LogoutCommand(userId));
        return Ok();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDTO>> GetMe()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        return Ok(await _mediator.Send(new GetCurrentUserQuery(userId)));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserDTO>> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        return Ok(await _mediator.Send(new UpdateProfileCommand(userId, request.Name, request.Phone, request.Base64Image, request.Doc, request.Dob, request.Username, request.Country, request.Type)));
    }

    [HttpPut("me/password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        await _mediator.Send(new ChangePasswordCommand(userId, request));
        return Ok();
    }

    [HttpDelete("users/{userId}")]
    [Authorize]
    public async Task<ActionResult> DeleteUser(int userId)
    {
        var requesterId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        await _mediator.Send(new DeleteUserCommand(userId, requesterId));
        return Ok();
    }
}

public record UpdateProfileRequest(string? Name, string? Phone, string? Base64Image, string? Doc, DateTime? Dob, string? Username, string? Country, int? Type);

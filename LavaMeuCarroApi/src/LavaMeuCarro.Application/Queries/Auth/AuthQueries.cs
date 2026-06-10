using MediatR;
using LavaMeuCarro.Application.DTOs;

namespace LavaMeuCarro.Application.Queries.Auth;

public record GetCurrentUserQuery(int UserId) : IRequest<UserDTO>;
public record GetAllUsersQuery(int Page, int PageSize, string? Search) : IRequest<PagedResult<UserDTO>>;

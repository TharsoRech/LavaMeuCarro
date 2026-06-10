using MediatR;
using LavaMeuCarro.Application.DTOs;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Exceptions;

namespace LavaMeuCarro.Application.Queries.Auth;

public class GetCurrentUserHandler : IRequestHandler<GetCurrentUserQuery, UserDTO>
{
    private readonly IUserRepository _repo;
    public GetCurrentUserHandler(IUserRepository repo) => _repo = repo;

    public async Task<UserDTO> Handle(GetCurrentUserQuery cmd, CancellationToken ct)
    {
        var user = await _repo.GetByIdAsync(cmd.UserId)
            ?? throw new NotFoundException("User not found");
        return new UserDTO(user.Id, user.Name, user.Email, user.Phone, user.Base64Image, user.Doc, user.Dob, user.Username, user.Country, user.Type, user.Active, user.CreatedAt);
    }
}

public class GetAllUsersHandler : IRequestHandler<GetAllUsersQuery, PagedResult<UserDTO>>
{
    private readonly IUserRepository _repo;
    public GetAllUsersHandler(IUserRepository repo) => _repo = repo;

    public async Task<PagedResult<UserDTO>> Handle(GetAllUsersQuery cmd, CancellationToken ct)
    {
        var users = await _repo.GetAllAsync(cmd.Page, cmd.PageSize, cmd.Search);
        var total = await _repo.CountAsync(cmd.Search);
        var items = users.Select(u => new UserDTO(u.Id, u.Name, u.Email, u.Phone, u.Base64Image, u.Doc, u.Dob, u.Username, u.Country, u.Type, u.Active, u.CreatedAt)).ToList();
        return new PagedResult<UserDTO>(items, total, cmd.Page, cmd.PageSize);
    }
}

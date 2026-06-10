using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/support")]
public class SupportController : ControllerBase
{
    private readonly ISupportSettingRepository _repo;
    public SupportController(ISupportSettingRepository repo) => _repo = repo;

    [HttpGet("contact")]
    public async Task<ActionResult> GetContact()
    {
        var settings = await _repo.GetAllAsync();

        return Ok(new
        {
            email = settings.GetValueOrDefault("support_email") ?? "suporte@lavameucarro.com",
            phone = settings.GetValueOrDefault("support_phone") ?? "(00) 00000-0000",
            whatsapp = settings.GetValueOrDefault("support_whatsapp") ?? "5500000000000"
        });
    }
}

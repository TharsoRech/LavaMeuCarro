using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.DTOs;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/telemetria")]
public class TelemetriaController : ControllerBase
{
    [HttpGet("health")]
    public ActionResult<TelemetriaDTO> Health() => Ok(new TelemetriaDTO(DateTime.UtcNow));

    [HttpGet("server-time")]
    public ActionResult<TelemetriaDTO> ServerTime() => Ok(new TelemetriaDTO(DateTime.UtcNow));
}

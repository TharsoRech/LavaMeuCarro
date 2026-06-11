using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api/legal")]
public class LegalController : ControllerBase
{
    private readonly ILegalDocumentRepository _repo;
    public LegalController(ILegalDocumentRepository repo) => _repo = repo;

    [HttpGet("privacy-policy")]
    public async Task<ActionResult> GetPrivacyPolicy()
    {
        var doc = await _repo.GetByCodeAsync("privacy_policy");
        if (doc == null)
        {
            return Ok(new
            {
                id = 0,
                type = "privacy_policy",
                title = "Política de Privacidade",
                content = "<p>Política de privacidade do LavaMeuCarro. Em elaboração.</p>",
                updatedAt = DateTime.UtcNow
            });
        }
        return Ok(new
        {
            doc.Id,
            type = "privacy_policy",
            doc.Title,
            doc.Content,
            doc.Version,
            updatedAt = doc.CreatedAt
        });
    }

    [HttpGet("terms-of-use")]
    public async Task<ActionResult> GetTermsOfUse()
    {
        var doc = await _repo.GetByCodeAsync("terms_of_use");
        if (doc == null)
        {
            return Ok(new
            {
                id = 0,
                type = "terms_of_use",
                title = "Termos de Uso",
                content = "<p>Termos de uso do LavaMeuCarro. Em elaboração.</p>",
                updatedAt = DateTime.UtcNow
            });
        }
        return Ok(new
        {
            doc.Id,
            type = "terms_of_use",
            doc.Title,
            doc.Content,
            doc.Version,
            updatedAt = doc.CreatedAt
        });
    }

    [HttpGet("documents/{context}")]
    public async Task<ActionResult> GetLegalDocumentsByContext(string context)
    {
        var docs = await _repo.GetByContextAsync(context);
        return Ok(docs.Select(d => new
        {
            d.Id,
            d.Code,
            d.Title,
            d.Version,
            d.Context,
            d.Content,
            d.IsRequired
        }));
    }
}

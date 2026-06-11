using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LavaMeuCarro.Application.Interfaces;
using LavaMeuCarro.Domain.Entities;
using LavaMeuCarro.Domain.Enums;

namespace LavaMeuCarro.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IAvaliacaoRepository _avaliacaoRepo;
    private readonly INpsFeedbackRepository _npsRepo;
    private readonly IAgendamentoRepository _agendamentoRepo;

    public FeedbackController(
        IAvaliacaoRepository avaliacaoRepo,
        INpsFeedbackRepository npsRepo,
        IAgendamentoRepository agendamentoRepo)
    {
        _avaliacaoRepo = avaliacaoRepo;
        _npsRepo = npsRepo;
        _agendamentoRepo = agendamentoRepo;
    }

    private int UserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    /// <summary>
    /// Submit appointment feedback (professional rating, salon rating, or both).
    /// Follows HoraDaBeleza pattern: step-based feedback with professional first, then salon.
    /// </summary>
    [HttpPost("reviews/appointment-feedback")]
    public async Task<IActionResult> SubmitAppointmentFeedback([FromBody] AppointmentFeedbackRequest request)
    {
        try
        {
            // Validate appointment exists and belongs to user
            var agendamento = await _agendamentoRepo.GetByIdAsync(request.AppointmentId);
            if (agendamento == null)
                return NotFound(new { message = "Agendamento não encontrado" });

            if (agendamento.ClientId != UserId)
                return Forbid();

            // Check if appointment is completed
            if (agendamento.Status != AgendamentoStatus.Finalizado)
                return UnprocessableEntity(new { message = "Apenas agendamentos finalizados podem ser avaliados" });

            // Handle professional rating
            if (request.ProfessionalRating.HasValue && request.ProfessionalRating > 0)
            {
                // Check if already reviewed professional
                var existingProfessionalReviews = await _avaliacaoRepo.GetByFuncionarioAsync(
                    agendamento.FuncionarioId);
                var alreadyReviewedProfessional = existingProfessionalReviews
                    .Any(a => a.AgendamentoId == request.AppointmentId && a.TargetType == ReviewTarget.Funcionario);

                if (!alreadyReviewedProfessional)
                {
                    var profissionalAvaliacao = new Avaliacao
                    {
                        AgendamentoId = request.AppointmentId,
                        ClientId = UserId,
                        FuncionarioId = agendamento.FuncionarioId,
                        UnidadeId = agendamento.UnidadeId,
                        TargetType = ReviewTarget.Funcionario,
                        Rating = request.ProfessionalRating.Value,
                        Comment = request.Comment,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _avaliacaoRepo.CreateAsync(profissionalAvaliacao);
                }
            }

            // Handle salon rating
            if (request.SalonRating.HasValue && request.SalonRating > 0)
            {
                // Check if already reviewed salon
                var existingSalonReviews = await _avaliacaoRepo.GetByUnidadeAsync(agendamento.UnidadeId);
                var alreadyReviewedSalon = existingSalonReviews
                    .Any(a => a.AgendamentoId == request.AppointmentId && a.TargetType == ReviewTarget.Unidade);

                if (!alreadyReviewedSalon)
                {
                    var unidadeAvaliacao = new Avaliacao
                    {
                        AgendamentoId = request.AppointmentId,
                        ClientId = UserId,
                        FuncionarioId = agendamento.FuncionarioId,
                        UnidadeId = agendamento.UnidadeId,
                        TargetType = ReviewTarget.Unidade,
                        Rating = request.SalonRating.Value,
                        Comment = request.Comment,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _avaliacaoRepo.CreateAsync(unidadeAvaliacao);
                }
            }

            return Ok(new { status = "submitted" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { status = "error", message = ex.Message });
        }
    }

    /// <summary>
    /// Check if NPS survey should be shown (only once per user).
    /// </summary>
    [HttpGet("nps/should-show")]
    public async Task<IActionResult> ShouldShowNps()
    {
        try
        {
            var shouldShow = await _npsRepo.ShouldShowAsync(UserId);
            return Ok(new { shouldShow });
        }
        catch (Exception)
        {
            return Ok(new { shouldShow = false });
        }
    }

    /// <summary>
    /// Submit NPS feedback (0-10 score + optional comment).
    /// </summary>
    [HttpPost("nps/feedback")]
    public async Task<IActionResult> SubmitNpsFeedback([FromBody] NpsFeedbackRequest request)
    {
        try
        {
            var feedback = new NpsFeedback
            {
                UserId = UserId,
                Score = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };

            await _npsRepo.CreateAsync(feedback);
            return Ok(new { status = "submitted" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { status = "error", message = ex.Message });
        }
    }
}

// ==================== Request DTOs ====================

public record AppointmentFeedbackRequest(
    int AppointmentId,
    int? SalonRating,
    int? ProfessionalRating,
    string? Comment
);

public record NpsFeedbackRequest(
    int Rating,
    string? Comment
);

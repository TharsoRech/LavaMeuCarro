namespace LavaMeuCarro.Application.Interfaces;

public interface INewRelicLogService
{
    Task LogAsync(
        string level,
        string message,
        string source,
        string? userId = null,
        Dictionary<string, object?>? attributes = null,
        CancellationToken cancellationToken = default);
}

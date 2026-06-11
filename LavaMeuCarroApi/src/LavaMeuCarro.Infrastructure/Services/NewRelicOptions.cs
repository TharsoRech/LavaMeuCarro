namespace LavaMeuCarro.Infrastructure.Services;

public class NewRelicOptions
{
    public bool Enabled { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string AppName { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
}

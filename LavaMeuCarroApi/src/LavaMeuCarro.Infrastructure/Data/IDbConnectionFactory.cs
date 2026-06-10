using System.Data;

namespace LavaMeuCarro.Infrastructure.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}

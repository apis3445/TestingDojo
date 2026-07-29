using APINet.Models;

namespace APINet.Data;

public static class ServerTestData
{
    public static Server RandomServer()
    {
        var key = Random.Shared.Next(999_000, 999_999);
        return new Server
        {
            Key = key,
            Name = $"Server {key}",
            Url = $"https://example-{key}.contoso.com",
            Active = true
        };
    }
}

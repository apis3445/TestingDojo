namespace APINet.Models;

// Request body sent to the login endpoint (POST /api/Users/login).
// Values are never hardcoded here — they are read from configuration (user secrets locally, env vars in CI).
public class User
{
    public string Company { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

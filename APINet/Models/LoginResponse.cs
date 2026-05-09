namespace APINet.Models;

// Response body returned by the login endpoint.
// AccessToken is the JWT used in subsequent authenticated requests (added to the Authorization header).
// Mapping the full response allows tests to assert on any field, not just the token.
public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTime TokenExpiration { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public int CompanyKey { get; set; }
}

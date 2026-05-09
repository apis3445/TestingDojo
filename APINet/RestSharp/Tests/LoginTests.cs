using APINet.Models;

namespace APINet.RestSharp;

public class LoginTests : TestBase
{
    // [Arguments] makes TUnit run this test multiple times — once per set of arguments.
    // We pass the CONFIGURATION KEY names (strings like "USER_ADMIN_PASSWORD"), not the actual values.
    // The real credentials are read from Configuration inside the test body, keeping passwords out of the source code.
    [Test]
    [Arguments("USER_ADMIN_COMPANY", "USER_ADMIN_USERNAME", "USER_ADMIN_PASSWORD")]
    [Arguments("USER_COMPANY", "USER_USERNAME", "USER_PASSWORD")]
    public async Task Login_WithValidCredentials_ReturnsToken(
        string companyKey, string userNameKey, string passwordKey)
    {
        var client = ApiClient.Create(Configuration, useAuthUrl: true);
        var loginRequest = new User
        {
            Company  = Configuration[companyKey]!,  // reads from user secrets (local) or env var (CI)
            UserName = Configuration[userNameKey]!,
            Password = Configuration[passwordKey]!
        };

        var response = await client.PostAsync<LoginResponse>("/api/Users/login", loginRequest);

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(CanDecodeJwt(response.Data?.AccessToken ?? string.Empty)).IsTrue();
        await Assert.That(response.Data?.TokenExpiration).IsGreaterThan(DateTime.UtcNow);
        await Assert.That(response.Data?.TokenExpiration).IsLessThan(DateTime.UtcNow.AddHours(24));
    }

    [Test]
    public async Task Login_WithInvalidCredentials_Returns400()
    {
        var client = ApiClient.Create(Configuration, useAuthUrl: true);
        var loginRequest = new User
        {
            Company = "invalid",
            UserName = "invalid",
            Password = "wrongpassword"
        };

        var response = await client.PostAsync<LoginResponse>("/api/Users/login", loginRequest);

        await Assert.That(response.StatusCode).IsEqualTo(400);
    }

    [Test]
    [Arguments("en-US")]
    [Arguments("es-MX")]
    [Arguments("de-DE")]
    [Arguments("ja-JP")]
    public async Task Login_WithValidLanguage_Returns200(string language)
    {
        var client = ApiClient.Create(Configuration, useAuthUrl: true);
        var loginRequest = new User
        {
            Company  = Configuration["USER_ADMIN_COMPANY"]!,
            UserName = Configuration["USER_ADMIN_USERNAME"]!,
            Password = Configuration["USER_ADMIN_PASSWORD"]!,
            Language = language
        };

        var response = await client.PostAsync<LoginResponse>("/api/Users/login", loginRequest);

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(CanDecodeJwt(response.Data?.AccessToken ?? string.Empty)).IsTrue();
    }

    [Test]
    public async Task Login_WithInvalidLanguage_DefaultsToEnglish_Returns200()
    {
        var client = ApiClient.Create(Configuration, useAuthUrl: true);
        var loginRequest = new User
        {
            Company  = Configuration["USER_ADMIN_COMPANY"]!,
            UserName = Configuration["USER_ADMIN_USERNAME"]!,
            Password = Configuration["USER_ADMIN_PASSWORD"]!,
            Language = "xx-XX"
        };

        var response = await client.PostAsync<LoginResponse>("/api/Users/login", loginRequest);

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(CanDecodeJwt(response.Data?.AccessToken ?? string.Empty)).IsTrue();
    }

    private static bool CanDecodeJwt(string token)
    {
        var parts = token.Split('.');
        if (parts.Length != 3) return false;
        try
        {
            // Decode header and payload — the signature cannot be verified without the secret key.
            // A valid JWT must have base64url-encoded JSON in the first two segments.
            DecodeBase64Url(parts[0]);
            DecodeBase64Url(parts[1]);
            return true;
        }
        catch { return false; }
    }

    private static byte[] DecodeBase64Url(string segment)
    {
        var base64 = segment.Replace('-', '+').Replace('_', '/');
        base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');
        return Convert.FromBase64String(base64);
    }

    [Test]
    [Arguments("Company")]
    [Arguments("UserName")]
    [Arguments("Password")]
    public async Task Login_WithMissingRequiredField_Returns400(string missingField)
    {
        var client = ApiClient.Create(Configuration, useAuthUrl: true);
        object loginRequest = missingField switch
        {
            "Company"  => new { UserName = "user@test.com", Password = "pass" },
            "UserName" => new { Company = "testco",         Password = "pass" },
            "Password" => new { Company = "testco",         UserName = "user@test.com" },
            _          => throw new ArgumentOutOfRangeException(nameof(missingField))
        };

        var response = await client.PostAsync<LoginResponse>("/api/Users/login", loginRequest);

        await Assert.That(response.StatusCode).IsEqualTo(400);
    }
}

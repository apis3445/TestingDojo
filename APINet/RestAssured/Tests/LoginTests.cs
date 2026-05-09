using APINet.Models;
using static RestAssured.Dsl;

namespace APINet.RestAssured;

// Same tests as RestSharp/Tests/LoginTests.cs — implemented with RestAssured.Net instead.
// RestAssured.Net uses a Given / When / Then style borrowed from the Java REST Assured library.
// The goal is to let you compare the two libraries and choose the style that fits your team.
public class LoginTests : TestBase
{
    [Test]
    [Arguments("USER_ADMIN_COMPANY", "USER_ADMIN_USERNAME", "USER_ADMIN_PASSWORD")]
    [Arguments("USER_COMPANY", "USER_USERNAME", "USER_PASSWORD")]
    public async Task Login_WithValidCredentials_ReturnsToken(
        string companyKey, string userNameKey, string passwordKey)
    {
        var loginRequest = new User
        {
            Company  = Configuration[companyKey]!,  // reads from user secrets (local) or env var (CI)
            UserName = Configuration[userNameKey]!,
            Password = Configuration[passwordKey]!
        };

        // Given / When / Then reads almost like plain English:
        //   Given these request details → When we POST → Then we expect status 200 → deserialize the body.
        var response = Given()
            .ContentType("application/json")
            .Body(loginRequest)
        .When()
            .Post($"{AuthUrl}/api/Users/login")
        .Then()
            .StatusCode(200)
        .DeserializeTo<LoginResponse>();

        await Assert.That(CanDecodeJwt(response?.AccessToken ?? string.Empty)).IsTrue();
        await Assert.That(response?.TokenExpiration).IsGreaterThan(DateTime.UtcNow);
        await Assert.That(response?.TokenExpiration).IsLessThan(DateTime.UtcNow.AddHours(24));
    }

    [Test]
    public void Login_WithInvalidCredentials_Returns400()
    {
        var loginRequest = new User
        {
            Company = "invalid",
            UserName = "invalid",
            Password = "wrongpassword"
        };

        Given()
            .ContentType("application/json")
            .Body(loginRequest)
        .When()
            .Post($"{AuthUrl}/api/Users/login")
        .Then()
            .StatusCode(400);
    }

    [Test]
    [Arguments("en-US")]
    [Arguments("es-MX")]
    [Arguments("de-DE")]
    [Arguments("ja-JP")]
    public async Task Login_WithValidLanguage_Returns200(string language)
    {
        var loginRequest = new User
        {
            Company  = Configuration["USER_ADMIN_COMPANY"]!,
            UserName = Configuration["USER_ADMIN_USERNAME"]!,
            Password = Configuration["USER_ADMIN_PASSWORD"]!,
            Language = language
        };

        var response = Given()
            .ContentType("application/json")
            .Body(loginRequest)
        .When()
            .Post($"{AuthUrl}/api/Users/login")
        .Then()
            .StatusCode(200)
        .DeserializeTo<LoginResponse>();

        await Assert.That(CanDecodeJwt(response?.AccessToken ?? string.Empty)).IsTrue();
    }

    [Test]
    public async Task Login_WithInvalidLanguage_DefaultsToEnglish_Returns200()
    {
        var loginRequest = new User
        {
            Company  = Configuration["USER_ADMIN_COMPANY"]!,
            UserName = Configuration["USER_ADMIN_USERNAME"]!,
            Password = Configuration["USER_ADMIN_PASSWORD"]!,
            Language = "xx-XX"
        };

        var response = Given()
            .ContentType("application/json")
            .Body(loginRequest)
        .When()
            .Post($"{AuthUrl}/api/Users/login")
        .Then()
            .StatusCode(200)
        .DeserializeTo<LoginResponse>();

        await Assert.That(CanDecodeJwt(response?.AccessToken ?? string.Empty)).IsTrue();
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
    public void Login_WithMissingRequiredField_Returns400(string missingField)
    {
        object loginRequest = missingField switch
        {
            "Company"  => new { UserName = "user@test.com", Password = "pass" },
            "UserName" => new { Company = "testco",         Password = "pass" },
            "Password" => new { Company = "testco",         UserName = "user@test.com" },
            _          => throw new ArgumentOutOfRangeException(nameof(missingField))
        };

        Given()
            .ContentType("application/json")
            .Body(loginRequest)
        .When()
            .Post($"{AuthUrl}/api/Users/login")
        .Then()
            .StatusCode(400);
    }
}
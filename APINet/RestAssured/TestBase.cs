using APINet.Models;
using Microsoft.Extensions.Configuration;
using static RestAssured.Dsl;

namespace APINet.RestAssured;

// Base class for all test classes using RestAssured.Net — mirrors RestSharp/TestBase.cs.
// Both base classes do the same job (load config, obtain a JWT) but use different HTTP libraries.
// Compare them side-by-side to learn how RestSharp and RestAssured.Net approach the same task differently.
public abstract class TestBase
{
    protected static string AuthToken { get; private set; } = string.Empty;
    protected static IConfiguration Configuration { get; private set; } = null!;
    protected static string AuthUrl { get; private set; } = string.Empty;
    protected static string BaseUrl { get; private set; } = string.Empty;

    [Before(TestSession)]
    public static Task Setup()
    {
        var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Development";
        Configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddJsonFile($"appsettings.{env}.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables()
            .AddUserSecrets<TestBase>()
            .Build();

        AuthUrl = Configuration["Api:AuthUrl"]
            ?? throw new InvalidOperationException("Missing required configuration key 'Api:AuthUrl'.");
        BaseUrl = Configuration["Api:BaseUrl"]
            ?? throw new InvalidOperationException("Missing required configuration key 'Api:BaseUrl'.");

        var loginRequest = new User
        {
            Company = Configuration["USER_ADMIN_COMPANY"] ?? throw new InvalidOperationException("USER_ADMIN_COMPANY is not configured."),
            UserName = Configuration["USER_ADMIN_USERNAME"] ?? throw new InvalidOperationException("USER_ADMIN_USERNAME is not configured."),
            Password = Configuration["USER_ADMIN_PASSWORD"] ?? throw new InvalidOperationException("USER_ADMIN_PASSWORD is not configured.")
        };

        var loginResponse = Given()
            .ContentType("application/json")
            .Body(loginRequest)
        .When()
            .Post($"{AuthUrl}/api/Users/login")
        .Then()
            .StatusCode(200)
        .DeserializeTo<LoginResponse>();

        if (string.IsNullOrEmpty(loginResponse?.AccessToken))
            throw new InvalidOperationException("Session setup failed: could not authenticate.");

        AuthToken = loginResponse.AccessToken;
        return Task.CompletedTask;
    }
}

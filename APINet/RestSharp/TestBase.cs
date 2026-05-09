using APINet.Models;
using Microsoft.Extensions.Configuration;

namespace APINet.RestSharp;

// Base class for all test classes using RestSharp.
// Inherit from this to get Configuration (app settings + credentials) and AuthToken (pre-fetched JWT) for free.
// [Before(TestSession)] runs Setup() exactly once before any test in the session — not before each test.
// This means login happens once and the token is reused, keeping the suite fast.
public abstract class TestBase
{
    protected static string AuthToken { get; private set; } = string.Empty;
    protected static IConfiguration Configuration { get; private set; } = null!;
    protected static int DefaultTimeout { get; private set; }
    protected static int RetryAttempts { get; private set; }

    [Before(TestSession)]
    public static async Task Setup()
    {
        // Configuration is loaded in priority order — each source can override the previous one.
        // This means you can set a value in appsettings.json and override it with an environment variable,
        // or override both with a user secret on your local machine.
        // Load order: appsettings.json → appsettings.{env}.json → env vars → user secrets
        var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Development";
        Configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddJsonFile($"appsettings.{env}.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables()
            .AddUserSecrets<TestBase>()
            .Build();

        DefaultTimeout = int.Parse(Configuration["Api:TimeoutMs"] ?? "30000");
        RetryAttempts = int.Parse(Configuration["Api:RetryAttempts"] ?? "3");

        // Obtain a JWT token once per test class
        var authClient = ApiClient.Create(Configuration, useAuthUrl: true);
        var loginRequest = new User
        {
            Company = Configuration["USER_ADMIN_COMPANY"] ?? throw new InvalidOperationException("USER_ADMIN_COMPANY is not configured."),
            UserName = Configuration["USER_ADMIN_USERNAME"] ?? throw new InvalidOperationException("USER_ADMIN_USERNAME is not configured."),
            Password = Configuration["USER_ADMIN_PASSWORD"] ?? throw new InvalidOperationException("USER_ADMIN_PASSWORD is not configured.")
        };

        var response = await authClient.PostAsync<LoginResponse>("/api/Users/login", loginRequest);
        if (!response.IsSuccess || string.IsNullOrEmpty(response.Data?.AccessToken))
            throw new InvalidOperationException($"Session setup failed: could not authenticate. Status: {response.StatusCode}");

        AuthToken = response.Data.AccessToken;
    }
}

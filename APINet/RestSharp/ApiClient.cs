using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using RestSharp;
using RestSharp.Authenticators;

namespace APINet.RestSharp;

/// <summary>
public class ApiClient
{
    private readonly RestClient _client;

    /// <summary>
    /// Default timeout used when no value is supplied via parameters or appsettings.
    /// </summary>
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);

    /// <summary>
    /// Initializes a new instance of ApiClient.
    /// Timeout resolution order:
    ///   1. <paramref name="timeout"/> (explicit)
    ///   2. appsettings.json → Api:TimeoutMs (via IConfiguration)
    ///   3. 30 seconds hard-coded fallback
    /// </summary>
    /// <param name="url">Base URL of the API.</param>
    /// <param name="token">Optional JWT token for Bearer authentication.</param>
    /// <param name="timeout">Optional explicit request timeout. Overrides all other sources.</param>
    /// <param name="configuration">Optional IConfiguration for reading appsettings values.</param>
    public ApiClient(string url, string? token = null, TimeSpan? timeout = null, IConfiguration? configuration = null)
    {
        var options = new RestClientOptions(url)
        {
            // Resolve timeout: explicit → .runsettings → appsettings.json → default
            Timeout = timeout
                ?? ResolveTimeout(configuration)
                ?? DefaultTimeout
        };

        // Configure JWT authentication if token is provided.
        // RestSharp's JwtAuthenticator automatically adds the Bearer token to requests.
        if (!string.IsNullOrEmpty(token))
        {
            options.Authenticator = new JwtAuthenticator(token);
        }

        _client = new RestClient(options);
    }

    /// <summary>
    /// Convenience factory: reads BaseUrl, AuthUrl, TimeoutMs and RetryAttempts
    /// directly from an IConfiguration instance (appsettings.json / env vars).
    /// </summary>
    /// <param name="configuration">Application configuration.</param>
    /// <param name="token">Optional JWT token for Bearer authentication.</param>
    /// <param name="useAuthUrl">
    ///   When <c>true</c> uses Api:AuthUrl; otherwise uses Api:BaseUrl.
    /// </param>
    public static ApiClient Create(IConfiguration configuration, string? token = null, bool useAuthUrl = false)
    {
        var urlKey = useAuthUrl ? "Api:AuthUrl" : "Api:BaseUrl";
        var url = configuration[urlKey]
            ?? throw new InvalidOperationException(
                $"Missing required configuration key '{urlKey}'. "
                + "Add it to appsettings.json or as an environment variable.");

        return new ApiClient(url, token, configuration: configuration);
    }

    /// <summary>
    /// Resolves the request timeout from appsettings.json (Api:TimeoutMs).
    /// </summary>
    private static TimeSpan? ResolveTimeout(IConfiguration? configuration)
    {
        var configValue = configuration?["Api:TimeoutMs"];
        if (int.TryParse(configValue, out var fromConfig))
            return TimeSpan.FromMilliseconds(fromConfig);

        return null;
    }

    /// <summary>
    /// Sends a GET request to the specified endpoint
    /// </summary>
    public async Task<ApiResponse> GetAsync(string endpoint)
    {
        var request = new RestRequest(endpoint, Method.Get);
        var sw = Stopwatch.StartNew();
        var response = await _client.ExecuteAsync(request);
        sw.Stop();
        LogRequestResponse(request, response);
        return ProcessApiResponse(response, sw.Elapsed);
    }

    public async Task<ApiResponse<T>> GetAsync<T>(string endpoint)
    {
        var request = new RestRequest(endpoint, Method.Get);
        var sw = Stopwatch.StartNew();
        var response = await _client.ExecuteAsync(request);
        sw.Stop();
        LogRequestResponse(request, response);
        return ProcessApiResponse<T>(response, sw.Elapsed);
    }

    public async Task<ApiResponse> PostAsync(string endpoint, object body)
    {
        var request = new RestRequest(endpoint, Method.Post);
        request.AddJsonBody(body);
        var sw = Stopwatch.StartNew();
        var response = await _client.ExecuteAsync(request);
        sw.Stop();
        LogRequestResponse(request, response, body);
        return ProcessApiResponse(response, sw.Elapsed);
    }

    public async Task<ApiResponse<T>> PostAsync<T>(string endpoint, object body)
    {
        var request = new RestRequest(endpoint, Method.Post);
        request.AddJsonBody(body);
        var sw = Stopwatch.StartNew();
        var response = await _client.ExecuteAsync(request);
        sw.Stop();
        LogRequestResponse(request, response, body);
        return ProcessApiResponse<T>(response, sw.Elapsed);
    }

    public async Task<ApiResponse> PutAsync(string endpoint, object body)
    {
        var request = new RestRequest(endpoint, Method.Put);
        request.AddJsonBody(body);
        var sw = Stopwatch.StartNew();
        var response = await _client.ExecuteAsync(request);
        sw.Stop();
        LogRequestResponse(request, response, body);
        return ProcessApiResponse(response, sw.Elapsed);
    }

    public async Task<ApiResponse<T>> PutAsync<T>(string endpoint, object body)
    {
        var request = new RestRequest(endpoint, Method.Put);
        request.AddJsonBody(body);
        var sw = Stopwatch.StartNew();
        var response = await _client.ExecuteAsync(request);
        sw.Stop();
        LogRequestResponse(request, response, body);
        return ProcessApiResponse<T>(response, sw.Elapsed);
    }

    public async Task<ApiResponse> DeleteAsync(string endpoint)
    {
        var request = new RestRequest(endpoint, Method.Delete);
        var sw = Stopwatch.StartNew();
        var response = await _client.ExecuteAsync(request);
        sw.Stop();
        LogRequestResponse(request, response);
        return ProcessApiResponse(response, sw.Elapsed);
    }

    private static ApiResponse ProcessApiResponse(RestResponse response, TimeSpan responseTime)
    {
        return new ApiResponse
        {
            StatusCode = (int)response.StatusCode,
            Content = response.Content ?? string.Empty,
            IsSuccess = response.IsSuccessful,
            ErrorMessage = response.ErrorMessage ?? response.ErrorException?.Message,
            ResponseTime = responseTime
        };
    }

    private static ApiResponse<T> ProcessApiResponse<T>(RestResponse response, TimeSpan responseTime)
    {
        var apiResponse = new ApiResponse<T>
        {
            StatusCode = (int)response.StatusCode,
            Content = response.Content ?? string.Empty,
            IsSuccess = response.IsSuccessful,
            ErrorMessage = response.ErrorMessage ?? response.ErrorException?.Message,
            ResponseTime = responseTime
        };

        if (response.IsSuccessful && !string.IsNullOrEmpty(response.Content))
            apiResponse.Data = JsonSerializer.Deserialize<T>(response.Content);

        return apiResponse;
    }

    private void LogRequestResponse(RestRequest request, RestResponse response, object? body = null)
    {
        if ((int)response.StatusCode >= 400)
        {
            Console.WriteLine($"Method: {request.Method}");
            Console.WriteLine($"URL: {response.ResponseUri}");
            Console.WriteLine($"Status Code: {(int)response.StatusCode} {response.StatusCode}");

            if (body != null)
            {
                Console.WriteLine($"Request Body: {JsonSerializer.Serialize(body, new JsonSerializerOptions { WriteIndented = true })}");
            }

            Console.WriteLine($"Response Body: {response.Content}");
        }
    }
}

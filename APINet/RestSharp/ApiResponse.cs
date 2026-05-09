namespace APINet.RestSharp;

// Standardized wrapper around every HTTP response from ApiClient.
// Tests always receive one of these — they never deal with RestSharp's raw RestResponse directly.
public class ApiResponse
{
    public int StatusCode { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public bool IsSuccess { get; set; } = true;
    public TimeSpan ResponseTime { get; set; }
}

// Generic version that also carries a deserialized response body of type T.
// Example: ApiResponse<LoginResponse> gives you both the status code and the parsed token.
public class ApiResponse<T> : ApiResponse
{
    public T? Data { get; set; }
}

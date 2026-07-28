namespace APINet.Models;

// Shape of the 400 validation-error body returned by the API (RFC 9110 problem+json).
// Only the "errors" dictionary is mapped since that is all the tests assert on.
public class ValidationProblemDetails
{
    public Dictionary<string, List<string>> Errors { get; set; } = new();
}

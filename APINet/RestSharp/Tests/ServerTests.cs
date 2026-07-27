using APINet.Models;
using System.Text.Json;

namespace APINet.RestSharp;

public class ServerTests : TestBase
{
    [Test]
    public async Task GetServers_WithAdminUser_Returns200()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var response = await client.GetAsync<List<Server>>("/api/Server");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data).IsNotNull();
        await Assert.That(response.Data!.Count).IsGreaterThan(0);
    }

    [Test]
    public async Task GetServerByKey_WithValidKey_ReturnsServerInfo()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var response = await client.GetAsync<Server>("/api/Server/1");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data?.Key).IsEqualTo(1);
        await Assert.That(response.Data?.Active).IsTrue();
    }

    [Test]
    public async Task GetServerByKey_WithInvalidKey_Returns404()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var response = await client.GetAsync("/api/Server/0");

        await Assert.That(response.StatusCode).IsEqualTo(404);
    }

    [Test]
    public async Task CreateServer_WithValidInfo_Returns201()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var newServer = RandomServer();

        var response = await client.PostAsync<Server>("/api/Server", newServer);

        try
        {
            await Assert.That(response.StatusCode).IsEqualTo(201);
            await Assert.That(response.Data?.Key).IsEqualTo(newServer.Key);
            await Assert.That(response.Data?.Name).IsEqualTo(newServer.Name);
            await Assert.That(response.Data?.Url).IsEqualTo(newServer.Url);
        }
        finally
        {
            if (response.Data is not null)
                await client.DeleteAsync($"/api/Server/{response.Data.Id}");
        }
    }

    // The Key here (1) already belongs to the seeded "Server Demo" record, and Id is omitted
    // so the API's duplicate check can't exclude it — this triggers all three validation errors at once.
    [Test]
    public async Task CreateServer_WithInvalidInfo_Returns400()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var invalidServer = new
        {
            Key = 1,
            Name = new string('a', 151),
            Active = true
        };

        var response = await client.PostAsync("/api/Server", invalidServer);
        var problem = JsonSerializer.Deserialize<ValidationProblemDetails>(
            response.Content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        await Assert.That(response.StatusCode).IsEqualTo(400);
        await Assert.That(problem?.Errors["Key"][0]).IsEqualTo("The server key already exists, please add another key");
        await Assert.That(problem?.Errors["Url"][0]).IsEqualTo("Required");
        await Assert.That(problem?.Errors["Name"][0]).IsEqualTo("StringLength");
    }

    [Test]
    public async Task UpdateServer_WithValidInfo_Returns204()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var created = await CreateServerAsync(client, RandomServer());

        try
        {
            var updated = new Server
            {
                Id = created.Id,
                Key = created.Key,
                Name = $"Updated {created.Name}",
                Url = created.Url,
                Active = true
            };

            var response = await client.PutAsync($"/api/Server/{created.Id}", updated);
            await Assert.That(response.StatusCode).IsEqualTo(204);

            var fetched = await client.GetAsync<Server>($"/api/Server/{created.Key}");
            await Assert.That(fetched.Data?.Name).IsEqualTo(updated.Name);
        }
        finally
        {
            await client.DeleteAsync($"/api/Server/{created.Id}");
        }
    }

    // Route id is valid, but the body's Id doesn't match it — the API can no longer exclude this
    // record from its own key-uniqueness check, so the update is rejected with a duplicate-key error.
    [Test]
    public async Task UpdateServer_WithMismatchedId_Returns400()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var created = await CreateServerAsync(client, RandomServer());

        try
        {
            var mismatched = new Server
            {
                Id = created.Id + 999_999,
                Key = created.Key,
                Name = created.Name,
                Url = created.Url,
                Active = true
            };

            var response = await client.PutAsync($"/api/Server/{created.Id}", mismatched);
            await Assert.That(response.StatusCode).IsEqualTo(400);
        }
        finally
        {
            await client.DeleteAsync($"/api/Server/{created.Id}");
        }
    }

    [Test]
    public async Task DeleteServer_WithValidId_Returns200()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var created = await CreateServerAsync(client, RandomServer());

        var response = await client.DeleteAsync($"/api/Server/{created.Id}");

        await Assert.That(response.StatusCode).IsEqualTo(200);
    }

    [Test]
    public async Task DeleteServer_WithInvalidId_Returns404()
    {
        var client = ApiClient.Create(Configuration, AuthToken, useAuthUrl: true);
        var response = await client.DeleteAsync("/api/Server/0");

        await Assert.That(response.StatusCode).IsEqualTo(404);
    }

    [Test]
    public async Task GetServers_WithoutJwt_Returns401()
    {
        var client = ApiClient.Create(Configuration, useAuthUrl: true);
        var response = await client.GetAsync("/api/Server");

        await Assert.That(response.StatusCode).IsEqualTo(401);
    }

    [Test]
    public async Task GetServers_WithNormalUser_Returns403()
    {
        var authClient = ApiClient.Create(Configuration, useAuthUrl: true);
        var loginRequest = new User
        {
            Company = Configuration["USER_COMPANY"]!,
            UserName = Configuration["USER_USERNAME"]!,
            Password = Configuration["USER_PASSWORD"]!
        };
        var loginResponse = await authClient.PostAsync<LoginResponse>("/api/Users/login", loginRequest);

        var client = ApiClient.Create(Configuration, loginResponse.Data!.AccessToken, useAuthUrl: true);
        var response = await client.GetAsync("/api/Server");

        await Assert.That(response.StatusCode).IsEqualTo(403);
    }

    private static Server RandomServer()
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

    private static async Task<Server> CreateServerAsync(ApiClient client, Server server)
    {
        var response = await client.PostAsync<Server>("/api/Server", server);
        return response.Data!;
    }
}
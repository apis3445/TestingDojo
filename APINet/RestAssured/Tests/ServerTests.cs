using APINet.Models;
using NHamcrest;
using static RestAssured.Dsl;

namespace APINet.RestAssured;

public class ServerTests : TestBase
{
    private const string ServersEndpoint = "api/server";

   [Test]
   public async Task GetServers_WithValidAdminUser_ReturnsServers()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{AuthUrl}/{ServersEndpoint}")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<Server>>();

        await Assert.That(response?.Count ?? 0).IsGreaterThan(0);
    }

    [Test]
    public async Task GetServerByKey_WithValidKey_ReturnsServerInfo()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{AuthUrl}/{ServersEndpoint}/1")
        .Then()
            .StatusCode(200)
        .DeserializeTo<Server>();

        await Assert.That(response?.Key).IsEqualTo(1);
        await Assert.That(response?.Active).IsTrue();
    }

    [Test]
    public void GetServerByKey_WithInvalidKey_Returns404()
    {
        Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{AuthUrl}/{ServersEndpoint}/0")
        .Then()
            .StatusCode(404);
    }

    [Test]
    public async Task CreateServer_WithValidInfo_Returns201()
    {
        var newServer = RandomServer();

        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
            .ContentType("application/json")
            .Body(newServer)
        .When()
            .Post($"{AuthUrl}/{ServersEndpoint}")
        .Then()
            .StatusCode(201)
        .DeserializeTo<Server>();

        try
        {
            await Assert.That(response?.Key).IsEqualTo(newServer.Key);
            await Assert.That(response?.Name).IsEqualTo(newServer.Name);
            await Assert.That(response?.Url).IsEqualTo(newServer.Url);
        }
        finally
        {
            if (response is not null) DeleteServer(response.Id);
        }
    }

    // The Key here (1) already belongs to the seeded "Server Demo" record, and Id is omitted
    // so the API's duplicate check can't exclude it — this triggers all three validation errors at once.
    [Test]
    public void CreateServer_WithInvalidInfo_Returns400()
    {
        var invalidServer = new
        {
            Key = 1,
            Name = new string('a', 151),
            Active = true
        };

        Given()
            .Header("Authorization", $"Bearer {AuthToken}")
            .ContentType("application/json")
            .Body(invalidServer)
        .When()
            .Post($"{AuthUrl}/{ServersEndpoint}")
        .Then()
            .StatusCode(400)
            .And().Body("$.errors.Key[0]", Is.EqualTo("This server key is already in use. Please choose a different one."))
            .And().Body("$.errors.Url[0]", Is.EqualTo("Url is required."))
            .And().Body("$.errors.Name[0]", Is.EqualTo("Name must be at most 150 characters."));
    }

    [Test]
    public async Task UpdateServer_WithValidInfo_Returns204()
    {
        var created = CreateServer(RandomServer());

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

            Given()
                .Header("Authorization", $"Bearer {AuthToken}")
                .ContentType("application/json")
                .Body(updated)
            .When()
                .Put($"{AuthUrl}/{ServersEndpoint}/{created.Id}")
            .Then()
                .StatusCode(204);

            var fetched = Given()
                .Header("Authorization", $"Bearer {AuthToken}")
            .When()
                .Get($"{AuthUrl}/{ServersEndpoint}/{created.Key}")
            .Then()
                .StatusCode(200)
            .DeserializeTo<Server>();

            await Assert.That(fetched?.Name).IsEqualTo(updated.Name);
        }
        finally
        {
            DeleteServer(created.Id);
        }
    }

    [Test]
    public void UpdateServer_WithMismatchedId_Returns400()
    {
        var created = CreateServer(RandomServer());

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

            Given()
                .Header("Authorization", $"Bearer {AuthToken}")
                .ContentType("application/json")
                .Body(mismatched)
            .When()
                .Put($"{AuthUrl}/{ServersEndpoint}/{created.Id}")
            .Then()
                .StatusCode(400);
        }
        finally
        {
            DeleteServer(created.Id);
        }
    }

    [Test]
    public void DeleteServer_WithValidId_Returns200()
    {
        var created = CreateServer(RandomServer());

        Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Delete($"{AuthUrl}/{ServersEndpoint}/{created.Id}")
        .Then()
            .StatusCode(200);
    }

    [Test]
    public void DeleteServer_WithInvalidId_Returns404()
    {
        Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Delete($"{AuthUrl}/{ServersEndpoint}/0")
        .Then()
            .StatusCode(404);
    }

    [Test]
    public void GetServers_WithoutJwt_Returns401()
    {
        Given()
        .When()
            .Get($"{AuthUrl}/{ServersEndpoint}")
        .Then()
            .StatusCode(401);
    }

    [Test]
    public void GetServers_WithNormalUser_Returns403()
    {
        var loginRequest = new User
        {
            Company = Configuration["USER_COMPANY"]!,
            UserName = Configuration["USER_USERNAME"]!,
            Password = Configuration["USER_PASSWORD"]!
        };

        var loginResponse = Given()
            .ContentType("application/json")
            .Body(loginRequest)
        .When()
            .Post($"{AuthUrl}/api/Users/login")
        .Then()
            .StatusCode(200)
        .DeserializeTo<LoginResponse>();

        Given()
            .Header("Authorization", $"Bearer {loginResponse?.AccessToken}")
        .When()
            .Get($"{AuthUrl}/{ServersEndpoint}")
        .Then()
            .StatusCode(403);
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

    private static Server CreateServer(Server server)
    {
        return Given()
            .Header("Authorization", $"Bearer {AuthToken}")
            .ContentType("application/json")
            .Body(server)
        .When()
            .Post($"{AuthUrl}/{ServersEndpoint}")
        .Then()
            .StatusCode(201)
        .DeserializeTo<Server>()!;
    }

    private static void DeleteServer(int id)
    {
        Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Delete($"{AuthUrl}/{ServersEndpoint}/{id}");
    }
}
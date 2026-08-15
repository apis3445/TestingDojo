using APINet.Models;
using static RestAssured.Dsl;

namespace APINet.RestAssured;

public class DashboardTests : TestBase
{
    private const string CollectionEndpoint = "api/collection";

    [Test]
    public async Task GetSummary_WithValidUser_ReturnsGlobalSummary()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/summary")
        .Then()
            .StatusCode(200)
        .DeserializeTo<CollectionSummary>();

        await Assert.That(response!.Amount).IsGreaterThanOrEqualTo(0);
        await Assert.That(response.AverageDaysPastDue).IsGreaterThanOrEqualTo(0);
    }

    // The API guarantees Limit1+2+3 always equals the global summary Amount, and the four
    // percentages always sum to 100 — the same cross-endpoint invariant the Postman tests check.
    [Test]
    public async Task GetDueDateSummary_WithValidUser_ReturnsGlobalDueDateSummary()
    {
        var summary = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/summary")
        .Then()
            .StatusCode(200)
        .DeserializeTo<CollectionSummary>();

        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/due-date-summary")
        .Then()
            .StatusCode(200)
        .DeserializeTo<DueDateSummary>();

        var totalLimits = response!.Limit1 + response.Limit2 + response.Limit3;
        var totalPercentage = response.LimitPercentage1 + response.LimitPercentage2
            + response.LimitPercentage3 + response.PercentageToExpire;

        await Assert.That(totalLimits).IsEqualTo(summary!.Amount);
        await Assert.That(totalPercentage).IsEqualTo(100m);
    }

    [Test]
    public async Task GetTop5Total_WithValidUser_ReturnsTop5ClientsWithBiggestDebt()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-5-total")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<TopClient>>();

        await Assert.That(response?.Count).IsEqualTo(5);
    }

    [Test]
    public async Task GetTop5AvgDays_WithValidUser_ReturnsTop5ClientsWithMostDelayedDays()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-5-avg-days")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<TopClient>>();

        await Assert.That(response?.Count).IsEqualTo(5);
    }

    [Test]
    public async Task GetTop5Type_WithValidUser_ReturnsTop5ClientDebtsByPeriod()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-5-type")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<ClientDebtByPeriod>>();

        await Assert.That(response?.Count).IsEqualTo(5);
    }

    // Detailed requires a real ClientId, so it chains off Top5Total the same way the
    // Postman request reuses the ClientId/Total collection variables set there.
    [Test]
    public async Task GetDetailed_WithValidClientId_ReturnsInvoicePaymentInfo()
    {
        var topClients = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-5-total")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<TopClient>>();

        var client = topClients![0];

        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/detailed/{client.ClientId}")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<Invoice>>();

        var invoicesTotal = response!.Sum(invoice => invoice.Total);

        await Assert.That(response!.Count).IsGreaterThan(0);
        await Assert.That(invoicesTotal).IsEqualTo(client.Total);
    }

    [Test]
    public async Task GetTop10ToExpire_WithValidUser_ReturnsTop10ClientsBiggestDebt()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-10-to-expire")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<TopClient>>();

        await Assert.That(response!.Count).IsLessThanOrEqualTo(10);
    }

    [Test]
    public async Task GetTop10Limit1_WithValidUser_ReturnsTop10ClientsWithin30Days()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-10-limit-1")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<TopClient>>();

        await Assert.That(response!.Count).IsLessThanOrEqualTo(10);
    }

    [Test]
    public async Task GetTop10Limit2_WithValidUser_ReturnsTop10ClientsWithin60Days()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-10-limit-2")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<TopClient>>();

        await Assert.That(response!.Count).IsLessThanOrEqualTo(10);
    }

    [Test]
    public async Task GetTop10Limit3_WithValidUser_ReturnsTop10ClientsMoreThan60Days()
    {
        var response = Given()
            .Header("Authorization", $"Bearer {AuthToken}")
        .When()
            .Get($"{BaseUrl}/{CollectionEndpoint}/top-10-limit-3")
        .Then()
            .StatusCode(200)
        .DeserializeTo<List<TopClient>>();

        await Assert.That(response!.Count).IsLessThanOrEqualTo(10);
    }
}

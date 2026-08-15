using APINet.Models;

namespace APINet.RestSharp;

public class DashboardTests : TestBase
{
    private const string CollectionEndpoint = "/api/collection";

    [Test]
    public async Task GetSummary_WithValidUser_ReturnsGlobalSummary()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<CollectionSummary>($"{CollectionEndpoint}/summary");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data!.Amount).IsGreaterThanOrEqualTo(0);
        await Assert.That(response.Data.AverageDaysPastDue).IsGreaterThanOrEqualTo(0);
    }

    // The API guarantees Limit1+2+3 always equals the global summary Amount, and the four
    // percentages always sum to 100 — the same cross-endpoint invariant the Postman tests check.
    [Test]
    public async Task GetDueDateSummary_WithValidUser_ReturnsGlobalDueDateSummary()
    {
        var client = ApiClient.Create(Configuration, AuthToken);

        var summary = await client.GetAsync<CollectionSummary>($"{CollectionEndpoint}/summary");
        var response = await client.GetAsync<DueDateSummary>($"{CollectionEndpoint}/due-date-summary");

        var totalLimits = response.Data!.Limit1 + response.Data.Limit2 + response.Data.Limit3;
        var totalPercentage = response.Data.LimitPercentage1 + response.Data.LimitPercentage2
            + response.Data.LimitPercentage3 + response.Data.PercentageToExpire;

        await Assert.That(totalLimits).IsEqualTo(summary.Data!.Amount);
        await Assert.That(totalPercentage).IsEqualTo(100m);
    }

    [Test]
    public async Task GetTop5Total_WithValidUser_ReturnsTop5ClientsWithBiggestDebt()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<List<TopClient>>($"{CollectionEndpoint}/top-5-total");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data?.Count).IsEqualTo(5);
    }

    [Test]
    public async Task GetTop5AvgDays_WithValidUser_ReturnsTop5ClientsWithMostDelayedDays()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<List<TopClient>>($"{CollectionEndpoint}/top-5-avg-days");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data?.Count).IsEqualTo(5);
    }

    [Test]
    public async Task GetTop5Type_WithValidUser_ReturnsTop5ClientDebtsByPeriod()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<List<ClientDebtByPeriod>>($"{CollectionEndpoint}/top-5-type");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data?.Count).IsEqualTo(5);
    }

    // Detailed requires a real ClientId, so it chains off Top5Total the same way the
    // Postman request reuses the ClientId/Total collection variables set there.
    [Test]
    public async Task GetDetailed_WithValidClientId_ReturnsInvoicePaymentInfo()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var topClients = await client.GetAsync<List<TopClient>>($"{CollectionEndpoint}/top-5-total");
        var topClient = topClients.Data![0];

        var response = await client.GetAsync<List<Invoice>>($"{CollectionEndpoint}/detailed/{topClient.ClientId}");
        var invoicesTotal = response.Data!.Sum(invoice => invoice.Total);

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data!.Count).IsGreaterThan(0);
        await Assert.That(invoicesTotal).IsEqualTo(topClient.Total);
    }

    [Test]
    public async Task GetTop10ToExpire_WithValidUser_ReturnsTop10ClientsBiggestDebt()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<List<TopClient>>($"{CollectionEndpoint}/top-10-to-expire");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data!.Count).IsLessThanOrEqualTo(10);
    }

    [Test]
    public async Task GetTop10Limit1_WithValidUser_ReturnsTop10ClientsWithin30Days()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<List<TopClient>>($"{CollectionEndpoint}/top-10-limit-1");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data!.Count).IsLessThanOrEqualTo(10);
    }

    [Test]
    public async Task GetTop10Limit2_WithValidUser_ReturnsTop10ClientsWithin60Days()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<List<TopClient>>($"{CollectionEndpoint}/top-10-limit-2");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data!.Count).IsLessThanOrEqualTo(10);
    }

    [Test]
    public async Task GetTop10Limit3_WithValidUser_ReturnsTop10ClientsMoreThan60Days()
    {
        var client = ApiClient.Create(Configuration, AuthToken);
        var response = await client.GetAsync<List<TopClient>>($"{CollectionEndpoint}/top-10-limit-3");

        await Assert.That(response.StatusCode).IsEqualTo(200);
        await Assert.That(response.Data!.Count).IsLessThanOrEqualTo(10);
    }
}

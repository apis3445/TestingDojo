namespace APINet.Models;

public class ClientDebtByPeriod
{
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public decimal NextToExpire { get; set; }
    public decimal Limit1 { get; set; }
    public decimal Limit2 { get; set; }
    public decimal Limit3 { get; set; }
}

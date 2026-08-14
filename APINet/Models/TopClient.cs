namespace APINet.Models;

public class TopClient
{
    public int ClientId { get; set; }
    public string Client { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public decimal DaysOverdue { get; set; }
}

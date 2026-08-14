namespace APINet.Models;

public class Invoice
{
    public int InvoiceId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal Paid { get; set; }
    public DateTime DueDate { get; set; }
    public int DaysOverdue { get; set; }
    public int ClientId { get; set; }
    public decimal Total { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime? LastPaymentDate { get; set; }
}

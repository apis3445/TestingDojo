namespace APINet.Models;

public class Server
{
    public int Id{ get; set; }
    public int Key{ get; set; }
    public string Name{ get; set; } = String.Empty;
    public string Url{ get; set; } = String.Empty;
    public bool Active{ get; set; } = true;

}
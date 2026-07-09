using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        // Just mock the GET request, or better yet, I can't easily get the auth token here.
        Console.WriteLine("Need token to test");
    }
}

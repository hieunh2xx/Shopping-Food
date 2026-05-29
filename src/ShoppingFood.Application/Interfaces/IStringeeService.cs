using System.Threading.Tasks;

namespace ShoppingFood.Application.Interfaces
{
    public interface IStringeeService
    {
        Task<bool> SendSmsOtpAsync(string toPhone, string otpCode);
    }
}

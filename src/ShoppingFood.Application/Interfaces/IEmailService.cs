using System.Threading.Tasks;

namespace ShoppingFood.Application.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendEmailOtpAsync(string toEmail, string otpCode);
    }
}

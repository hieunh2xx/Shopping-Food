using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ShoppingFood.Application.Interfaces;

namespace ShoppingFood.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendEmailOtpAsync(string toEmail, string otpCode)
        {
            try
            {
                var server = _configuration["SmtpSettings:Server"];
                var port = int.Parse(_configuration["SmtpSettings:Port"] ?? "587");
                var senderEmail = _configuration["SmtpSettings:SenderEmail"];
                var senderName = _configuration["SmtpSettings:SenderName"];
                var username = _configuration["SmtpSettings:Username"];
                var password = _configuration["SmtpSettings:Password"];
                var enableSsl = bool.Parse(_configuration["SmtpSettings:EnableSsl"] ?? "true");

                var message = new MailMessage
                {
                    From = new MailAddress(senderEmail!, senderName),
                    Subject = "ShoppingFood - Mã OTP xác nhận của bạn",
                    Body = $@"
                        <h3>Xin chào,</h3>
                        <p>Mã OTP xác nhận của bạn là: <strong>{otpCode}</strong></p>
                        <p>Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                        <br/>
                        <p>Trân trọng,<br/>Đội ngũ ShoppingFood</p>
                    ",
                    IsBodyHtml = true
                };

                message.To.Add(new MailAddress(toEmail));

                using var smtpClient = new SmtpClient(server, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = enableSsl
                };

                await smtpClient.SendMailAsync(message);
                return true;
            }
            catch (Exception)
            {
                // Log error
                return false;
            }
        }
    }
}

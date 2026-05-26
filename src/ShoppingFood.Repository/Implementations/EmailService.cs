using Microsoft.Extensions.Configuration;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace ShoppingFood.Repository.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var smtpServer = _configuration["SmtpSettings:Server"] ?? "smtp.gmail.com";
                var smtpPortStr = _configuration["SmtpSettings:Port"];
                var smtpPort = int.TryParse(smtpPortStr, out var port) ? port : 587;
                var senderEmail = _configuration["SmtpSettings:SenderEmail"] ?? "no-reply@shoppingfood.com";
                var senderName = _configuration["SmtpSettings:SenderName"] ?? "ShoppingFood Admin";
                var username = _configuration["SmtpSettings:Username"];
                var password = _configuration["SmtpSettings:Password"];
                var enableSslStr = _configuration["SmtpSettings:EnableSsl"];
                var enableSsl = !bool.TryParse(enableSslStr, out var ssl) || ssl; 
                using (var mailMessage = new MailMessage())
                {
                    mailMessage.From = new MailAddress(senderEmail, senderName);
                    mailMessage.Subject = subject;
                    mailMessage.Body = body;
                    mailMessage.IsBodyHtml = true;
                    mailMessage.To.Add(toEmail);

                    using (var smtpClient = new SmtpClient(smtpServer, smtpPort))
                    {
                        smtpClient.EnableSsl = enableSsl;
                        
                        if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
                        {
                            smtpClient.Credentials = new NetworkCredential(username, password);
                        }
                        
                        await smtpClient.SendMailAsync(mailMessage);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL SERVICE] Failed to send email to {toEmail}: {ex.Message}");
                throw;
            }
        }
    }
}

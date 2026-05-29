using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class SendLoginOtpCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string PreAuthToken { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty; // "email" or "phone"
        public string? IpAddress { get; set; }
    }
}

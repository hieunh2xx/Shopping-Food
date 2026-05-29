using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class VerifyLoginOtpCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string PreAuthToken { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
    }
}

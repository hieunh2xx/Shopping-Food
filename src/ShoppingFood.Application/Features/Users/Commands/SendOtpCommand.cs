using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class SendOtpCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Phone { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
    }
}

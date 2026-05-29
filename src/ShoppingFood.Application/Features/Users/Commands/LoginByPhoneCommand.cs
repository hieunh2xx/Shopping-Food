using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class LoginByPhoneCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Phone { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }
}

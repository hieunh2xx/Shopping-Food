using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ChangePasswordCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}

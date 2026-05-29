using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ForgotPasswordCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Email { get; set; } = string.Empty;
    }
}

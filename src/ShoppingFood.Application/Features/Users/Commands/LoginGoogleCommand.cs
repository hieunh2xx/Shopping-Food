using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class LoginGoogleCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Credential { get; set; } = string.Empty;
    }
}

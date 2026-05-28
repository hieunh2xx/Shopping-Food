using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class LoginMicrosoftCommand : BaseCommand, IRequest<ApiResponse>
    {
        /// <summary>
        /// Authorization code from Microsoft OAuth2 (authorization code flow)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// The redirect URI used in the authorization request (must match exactly)
        /// </summary>
        public string RedirectUri { get; set; } = string.Empty;
    }
}

using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetUserProfileQuery : IRequest<ApiResponse>
    {
        public string Username { get; set; } = string.Empty;
    }
}

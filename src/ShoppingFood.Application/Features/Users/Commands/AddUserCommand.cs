using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class AddUserCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Customer;
        public string? AvatarUrl { get; set; }
        public string OtpCode { get; set; } = string.Empty;
    }
}

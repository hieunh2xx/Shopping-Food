using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.UserAddresses.Commands
{
    public class AddUserAddressCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
}

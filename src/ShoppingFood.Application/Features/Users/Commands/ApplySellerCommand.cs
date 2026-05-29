using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ApplySellerCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string BusinessName { get; set; } = string.Empty;
        public string BusinessAddress { get; set; } = string.Empty;
        public string BusinessLicenseUrl { get; set; } = string.Empty;
        public string ShopImageUrl { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;
    }
}

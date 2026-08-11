using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpdateSellerApplicationCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id {  get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string BusinessAddress {  get; set; } = string.Empty;
        public string BusinessLicenseUrl { get; set; } = string.Empty;
        public string FoodSafetyCertificateUrl { get; set; } = string.Empty;
        public string ShopImageUrl { get; set;  } = string.Empty;
        public string ContactInfo {  get; set; } = string.Empty;
    }
}

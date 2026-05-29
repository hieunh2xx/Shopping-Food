using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class AddSellerCommand : IRequest<ApiResponse>
    {
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set;  } = string.Empty;
        public string Phone {  get; set; } = string.Empty;
        public string? AvatarUrl {  get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string BusinessAddress {  get; set; } = string.Empty;
        public string BusinessLicenseUrl {  get; set; } = string.Empty;
        public string ShopImageUrl {  get; set; } = string.Empty;
        public string ContactInfo {  get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Seller;
        public string OtpCode { get; set; } = string.Empty;
    }
}

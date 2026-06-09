using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class CheckoutCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string DeliveryAddress { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;
        public string? Note { get; set; }
        public Guid? GuestUserId { get; set; }
        public double? DeliveryLatitude { get; set; }
        public double? DeliveryLongitude { get; set; }
    }
}

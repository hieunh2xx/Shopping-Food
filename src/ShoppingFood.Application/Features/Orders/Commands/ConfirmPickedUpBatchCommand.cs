using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmPickedUpBatchCommand : BaseCommand, IRequest<ApiResponse>
    {
        public List<Guid> OrderIds { get; set; } = new();
        public string VerificationCode { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}

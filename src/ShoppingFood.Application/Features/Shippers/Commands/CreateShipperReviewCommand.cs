using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Shippers.Commands
{
    public class CreateShipperReviewCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}

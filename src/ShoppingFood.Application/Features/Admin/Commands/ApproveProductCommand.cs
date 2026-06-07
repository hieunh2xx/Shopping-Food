using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveProductCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ProductId { get; set; }
        public bool IsApproved { get; set; }
    }
}

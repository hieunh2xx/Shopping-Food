using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ReplyReviewCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ReviewId { get; set; }  // set từ route param
        public string Reply { get; set; } = string.Empty;
    }
}

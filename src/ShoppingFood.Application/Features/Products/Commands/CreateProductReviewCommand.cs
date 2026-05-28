using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class CreateProductReviewCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid ProductId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}

using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        
        public List<string>? ImageUrls { get; set; }
    }
}

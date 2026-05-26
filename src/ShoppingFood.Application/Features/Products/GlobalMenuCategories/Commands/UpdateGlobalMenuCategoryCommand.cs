using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class UpdateGlobalMenuCategoryCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
    }
}

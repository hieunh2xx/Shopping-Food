using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries
{
    public class DeleteGlobalMenuCategoryQuery : IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
    }
}

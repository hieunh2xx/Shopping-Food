using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Menu.Commands
{
    public class UpdateMenuCategoryCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }
}

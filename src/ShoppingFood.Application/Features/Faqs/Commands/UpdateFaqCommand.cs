using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Commands
{
    public class UpdateFaqCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }
}

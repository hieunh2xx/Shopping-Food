using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Queries
{
    public class GetFaqDetailQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
    }
}

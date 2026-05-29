using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Carts.Queries
{
    public class GetCartQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid? GuestUserId { get; set; }
    }
}

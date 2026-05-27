using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetSellerApplicationStatusQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}

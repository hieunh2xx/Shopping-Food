using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Shippers.Queries
{
    public class GetReputationHistoryQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}

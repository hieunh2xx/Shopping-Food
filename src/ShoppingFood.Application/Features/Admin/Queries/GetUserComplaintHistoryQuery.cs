using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Coordinator;
using System;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetUserComplaintHistoryQuery : IRequest<ApiResponse>
    {
        public Guid UserId { get; set; }
    }
}

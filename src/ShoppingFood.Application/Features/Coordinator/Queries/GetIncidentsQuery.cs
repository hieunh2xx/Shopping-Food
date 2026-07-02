using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetIncidentsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public string? IncidentType { get; set; } //DeliveryFailed" | "OrderComplaint" | "ShipperComplaint" | null (lấy tất cả)
    }
}

using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetShipperApplicationsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public ApplicationStatus? Status { get; set; }
    }
}

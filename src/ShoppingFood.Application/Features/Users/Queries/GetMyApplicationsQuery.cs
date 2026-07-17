using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.User;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetMyApplicationsQuery : BaseCommand, IRequest<ApiResponse>
    {
    }

    public class MyApplicationsResponseDto
    {
        public List<SellerApplicationDto> SellerApplications { get; set; } = new List<SellerApplicationDto>();
        public List<ShipperApplicationDto> ShipperApplications { get; set; } = new List<ShipperApplicationDto>();
    }
}

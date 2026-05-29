using System.Collections.Generic;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.User;

namespace ShoppingFood.Application.Features.UserAddresses.Queries
{
    public class GetUserAddressesQuery : BaseCommand, IRequest<ApiResponse>
    {
    }
}

using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Dto.User;

namespace ShoppingFood.Application.Features.UserAddresses.Queries
{
    public class GetUserAddressesHandler : IRequestHandler<GetUserAddressesQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        

        public GetUserAddressesHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
            
        }

        public async Task<ApiResponse> Handle(GetUserAddressesQuery request, CancellationToken cancellationToken)
        {
            var userId = request.CurrentUserId.Value;
            
            var addresses = await _dbContext.UserAddresses
                .Where(a => a.UserAccountId == userId)
                .OrderByDescending(a => a.IsDefault)
                .Select(a => new UserAddressDto
                {
                    Id = a.Id,
                    ContactName = a.ContactName,
                    ContactPhone = a.ContactPhone,
                    AddressLine = a.AddressLine,
                    IsDefault = a.IsDefault,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude
                })
                .ToListAsync(cancellationToken);

            return ApiResponse.Success(addresses);
        }
    }
}

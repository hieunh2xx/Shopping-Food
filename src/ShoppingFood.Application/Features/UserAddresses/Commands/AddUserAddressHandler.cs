using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;

namespace ShoppingFood.Application.Features.UserAddresses.Commands
{
    public class AddUserAddressHandler : IRequestHandler<AddUserAddressCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        

        public AddUserAddressHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
            
        }

        public async Task<ApiResponse> Handle(AddUserAddressCommand request, CancellationToken cancellationToken)
        {
            var userId = request.CurrentUserId.Value;

            if (request.IsDefault)
            {
                // Unset default for other addresses
                var defaults = await _dbContext.UserAddresses
                    .Where(a => a.UserAccountId == userId && a.IsDefault)
                    .ToListAsync(cancellationToken);
                
                foreach(var addr in defaults)
                {
                    addr.IsDefault = false;
                }
            }
            else
            {
                // If it's the first address, make it default automatically
                var count = await _dbContext.UserAddresses.CountAsync(a => a.UserAccountId == userId, cancellationToken);
                if (count == 0)
                {
                    request.IsDefault = true;
                }
            }

            var newAddress = new UserAddress
            {
                Id = Guid.NewGuid(),
                UserAccountId = userId,
                ContactName = request.ContactName,
                ContactPhone = request.ContactPhone,
                AddressLine = request.AddressLine,
                IsDefault = request.IsDefault
            };

            _dbContext.UserAddresses.Add(newAddress);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var dto = new UserAddressDto
            {
                Id = newAddress.Id,
                ContactName = newAddress.ContactName,
                ContactPhone = newAddress.ContactPhone,
                AddressLine = newAddress.AddressLine,
                IsDefault = newAddress.IsDefault
            };

            return ApiResponse.Success(dto, "Thêm địa chỉ thành công.");
        }
    }
}

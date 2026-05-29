using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Dto.User;

namespace ShoppingFood.Application.Features.UserAddresses.Commands
{
    public class UpdateUserAddressHandler : IRequestHandler<UpdateUserAddressCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        

        public UpdateUserAddressHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
            
        }

        public async Task<ApiResponse> Handle(UpdateUserAddressCommand request, CancellationToken cancellationToken)
        {
            var userId = request.CurrentUserId.Value;
            var address = await _dbContext.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == request.Id && a.UserAccountId == userId, cancellationToken);
            
            if (address == null) return ApiResponse.Failure(404, "Không tìm thấy địa chỉ.");

            if (request.IsDefault && !address.IsDefault)
            {
                // Unset other defaults
                var defaults = await _dbContext.UserAddresses
                    .Where(a => a.UserAccountId == userId && a.IsDefault)
                    .ToListAsync(cancellationToken);
                
                foreach(var addr in defaults)
                {
                    addr.IsDefault = false;
                }
            }
            else if (!request.IsDefault && address.IsDefault)
            {
                // Prevent removing default if it's the only one
                var count = await _dbContext.UserAddresses.CountAsync(a => a.UserAccountId == userId, cancellationToken);
                if (count > 1) 
                {
                    // Automatically set another one as default
                    var another = await _dbContext.UserAddresses
                        .FirstOrDefaultAsync(a => a.UserAccountId == userId && a.Id != request.Id, cancellationToken);
                    if (another != null) another.IsDefault = true;
                }
                else
                {
                    // Cannot unset default if it's the only address
                    request.IsDefault = true;
                }
            }

            address.ContactName = request.ContactName;
            address.ContactPhone = request.ContactPhone;
            address.AddressLine = request.AddressLine;
            address.IsDefault = request.IsDefault;

            await _dbContext.SaveChangesAsync(cancellationToken);

            var dto = new UserAddressDto
            {
                Id = address.Id,
                ContactName = address.ContactName,
                ContactPhone = address.ContactPhone,
                AddressLine = address.AddressLine,
                IsDefault = address.IsDefault
            };

            return ApiResponse.Success(dto, "Cập nhật địa chỉ thành công.");
        }
    }
}

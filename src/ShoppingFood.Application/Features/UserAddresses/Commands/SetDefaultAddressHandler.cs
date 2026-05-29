using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.Application.Features.UserAddresses.Commands
{
    public class SetDefaultAddressHandler : IRequestHandler<SetDefaultAddressCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        

        public SetDefaultAddressHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
            
        }

        public async Task<ApiResponse> Handle(SetDefaultAddressCommand request, CancellationToken cancellationToken)
        {
            var userId = request.CurrentUserId.Value;
            var address = await _dbContext.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == request.Id && a.UserAccountId == userId, cancellationToken);
            
            if (address == null) return ApiResponse.Failure(404, "Không tìm thấy địa chỉ.");

            if (!address.IsDefault)
            {
                var defaults = await _dbContext.UserAddresses
                    .Where(a => a.UserAccountId == userId && a.IsDefault)
                    .ToListAsync(cancellationToken);
                
                foreach(var addr in defaults)
                {
                    addr.IsDefault = false;
                }

                address.IsDefault = true;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return ApiResponse.Success(null, "Đã đặt làm địa chỉ mặc định.");
        }
    }
}

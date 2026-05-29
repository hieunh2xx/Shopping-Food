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
    public class DeleteUserAddressHandler : IRequestHandler<DeleteUserAddressCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        

        public DeleteUserAddressHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
            
        }

        public async Task<ApiResponse> Handle(DeleteUserAddressCommand request, CancellationToken cancellationToken)
        {
            var userId = request.CurrentUserId.Value;
            var address = await _dbContext.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == request.Id && a.UserAccountId == userId, cancellationToken);
            
            if (address == null) return ApiResponse.Failure(404, "Không tìm thấy địa chỉ.");

            if (address.IsDefault)
            {
                var another = await _dbContext.UserAddresses
                    .FirstOrDefaultAsync(a => a.UserAccountId == userId && a.Id != request.Id, cancellationToken);
                if (another != null) another.IsDefault = true;
            }

            _dbContext.UserAddresses.Remove(address);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(null, "Đã xóa địa chỉ.");
        }
    }
}

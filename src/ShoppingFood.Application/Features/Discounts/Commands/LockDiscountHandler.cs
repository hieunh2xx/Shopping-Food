using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class LockDiscountHandler : IRequestHandler<LockDiscountCommand, ApiResponse>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public LockDiscountHandler(
            IDiscountRepository discountRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _discountRepository = discountRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(LockDiscountCommand request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden. Only admin can emergency lock discount codes.");

            var discounts = await _discountRepository.GetAsync(
                predicate: d => d.Id == request.Id && !d.IsDeleted,
                disableTracking: false
                );
            var discount = discounts.FirstOrDefault();
            if (discount == null)
                return ApiResponse.Failure(404, "Discount code not found.");

            if (discount.Status == DiscountStatus.Cancelled)
                return ApiResponse.Success(null, "Discount code is already locked.");

            discount.Status = DiscountStatus.Cancelled;
            discount.UpdatedAt = DateTime.UtcNow;

            _discountRepository.Update(discount);
            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(null, "Discount code has been locked successfully.");
        }
    }
}

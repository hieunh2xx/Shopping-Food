using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class SaveDiscountHandler : IRequestHandler<SaveDiscountCommand, ApiResponse>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly ICustomerDiscountRepository _customerDiscountRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SaveDiscountHandler(
            IDiscountRepository discountRepository,
            ICustomerDiscountRepository customerDiscountRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _discountRepository = discountRepository;
            _customerDiscountRepository = customerDiscountRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(SaveDiscountCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                    );
                var user = users.FirstOrDefault();
                if (user == null || user.Profile == null)
                    return ApiResponse.Failure(404, "User profile not found.");

                if (user.Profile.Role != UserRole.Customer)
                    return ApiResponse.Failure(403, "Access denied. Only customers can perform this action.");

                var discounts = await _discountRepository.GetAsync(
                    predicate: d => d.Id == request.DiscountId,
                    disableTracking: true
                    );
                var discount = discounts.FirstOrDefault();
                if (discount == null)
                    return ApiResponse.Failure(404, "Discount code not found.");

                if (discount.Status != DiscountStatus.Active)
                    return ApiResponse.Failure(400, "This discount code is inactive or has been cancelled.");

                var now = DateTime.UtcNow;
                if(now < discount.StartDate || now > discount.EndDate)
                    return ApiResponse.Failure(400, "This discount code is expired or not yet active.");

                if(discount.UsedCount > discount.Quantity)
                    return ApiResponse.Failure(400, "This discount code has run out of usage.");

                var customerDiscounts = await _customerDiscountRepository.GetAsync(
                    predicate: cd => cd.UserAccountId == user.Id && cd.DiscountId == discount.Id,
                    disableTracking: true
                    );
                if(customerDiscounts.Any())
                    return ApiResponse.Failure(400, "This discount code is already saved in your wallet.");

                var customerDiscount = new CustomerDiscount
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = user.Id,
                    DiscountId = discount.Id,
                    UsageCount = 0,
                    SavedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _customerDiscountRepository.Add(customerDiscount);
                
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new { customerDiscount.Id, discount.Code }, "Discount code saved to wallet successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("SaveDiscountHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

using MediatR;
using ShoppingFood.Core.Base;
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
    public class ApplyDiscountHandler : IRequestHandler<ApplyDiscountCommand, ApiResponse>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly ICustomerDiscountRepository _customerDiscountRepository;

        public ApplyDiscountHandler(
            IDiscountRepository discountRepository,
            ICustomerDiscountRepository customerDiscountRepository)
        {
            _discountRepository = discountRepository;
            _customerDiscountRepository = customerDiscountRepository;
        }

        public async Task<ApiResponse> Handle(ApplyDiscountCommand request, CancellationToken cancellationToken)
        {
            var discounts = await _discountRepository.GetAsync(
            predicate: d => d.Code.ToUpper() == request.Code.ToUpper() &&
                            (d.RestaurantId == null || d.RestaurantId == request.RestaurantId) &&
                            !d.IsDeleted,
            disableTracking: true
            );
            var discount = discounts.FirstOrDefault(d => d.RestaurantId == request.RestaurantId)
                            ?? discounts.FirstOrDefault(d => d.RestaurantId == null);
            if (discount == null)
                return ApiResponse.Failure(404, "Discount code not found.");

            if (discount.Status != DiscountStatus.Active)
                return ApiResponse.Failure(400, "This discount code is inactive or cancelled.");

            var now = DateTime.UtcNow;
            if (now < discount.StartDate || now > discount.EndDate)
                return ApiResponse.Failure(400, "This discount code is expired or not active yet.");

            if (discount.UsedCount >= discount.Quantity)
                return ApiResponse.Failure(400, "This discount code has run out of usage.");

            if (request.CartAmount < discount.MinOrderAmount)
                return ApiResponse.Failure(400, $"Minium order amount of {discount.MinOrderAmount} is required to use this code.");

            if (request.CurrentUserId.HasValue)
            {
                var customerDiscounts = await _customerDiscountRepository.GetAsync(
                    predicate: cd => cd.UserAccountId == request.CurrentUserId.Value && cd.DiscountId == discount.Id,
                    disableTracking: true
                    );
                var customerDiscount = customerDiscounts.FirstOrDefault();
                if (customerDiscount != null && customerDiscount.UsageCount >= discount.MaxUsagePerUser)
                    return ApiResponse.Failure(400, "You have reached the maximum usage limit for this discount code.");
            }

            decimal discountAmount = CalculateDiscountAmount(discount, request.CartAmount);

            return ApiResponse.Success(new
            {
                DiscountId = discount.Id,
                Code = discount.Code,
                Type = discount.Type.ToString(),
                DiscountAmount = Math.Round(discountAmount, 2),
                FinalAmount = Math.Round(request.CartAmount - discountAmount, 2)
            }, "Discount code applied successfully.");
        }

        private decimal CalculateDiscountAmount(Discount discount, decimal cartAmount)
        {
            decimal discountAmount = 0;
            if (discount.Type == DiscountType.Percentage)
            {
                discountAmount = cartAmount * (discount.Value / 100);
                if (discount.MaxDiscountAmount.HasValue && discountAmount > discount.MaxDiscountAmount.Value)
                {
                    discountAmount = discount.MaxDiscountAmount.Value;
                }
            }
            else if (discount.Type == DiscountType.FixedAmount)
            {
                discountAmount = discount.Value;
                if (discountAmount > cartAmount)
                {
                    discountAmount = cartAmount;
                }
            }
            return discountAmount;
        }
    }
}

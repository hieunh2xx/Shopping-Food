using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Discount;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Queries
{
    public class GetDiscountHandler : IRequestHandler<GetDiscountQuery, ApiResponse>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly ICustomerDiscountRepository _customerDiscountRepository;
        private readonly IMapper _mapper;

        public GetDiscountHandler(
            IDiscountRepository discountRepository,
            ICustomerDiscountRepository customerDiscountRepository,
            IMapper mapper)
        {
            _discountRepository = discountRepository;
            _customerDiscountRepository = customerDiscountRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetDiscountQuery request, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            Expression<Func<Discount, bool>> predicate = d => true;
            
            if (!request.IncludeAll)
            {
                predicate = d =>
                    d.Status == DiscountStatus.Active &&
                    d.StartDate <= now && now <= d.EndDate &&
                    d.UsedCount < d.Quantity;
            }

            if(request.RestaurantId.HasValue && request.CartAmount.HasValue)
            {
                var restId = request.RestaurantId.Value;
                var amount = request.CartAmount.Value;
                var excludedDiscountIds = await GetExcludedDiscountIdsAsync(request.CurrentUserId);

                predicate = d =>
                    (request.IncludeAll || (
                        d.Status == DiscountStatus.Active &&
                        d.StartDate <= now && now <= d.EndDate &&
                        d.UsedCount < d.Quantity &&
                        amount >= d.MinOrderAmount &&
                        !excludedDiscountIds.Contains(d.Id)
                    )) &&
                    (d.RestaurantId == restId || d.RestaurantId == null);
            }

            var discounts = await _discountRepository.GetAsync(
                predicate: predicate,
                include: q => q.Include(d => d.Restaurant),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            var total = await _discountRepository.GetCountAsync(predicate);

            var dto = _mapper.Map<IReadOnlyList<DiscountDto>>(discounts);
            return ApiResponse.Success(dto, "Discounts retrieved successfully.");
        }

        private async Task<List<Guid>> GetExcludedDiscountIdsAsync(Guid? currentUserId)
        {
            if (!currentUserId.HasValue) return new List<Guid>();

            var customerDiscounts = await _customerDiscountRepository.GetAsync(
                predicate: cd => cd.UserAccountId == currentUserId.Value && cd.UsageCount >= cd.Discount.MaxUsagePerUser,
                include: q => q.Include(cd => cd.Discount),
                disableTracking: true
                );

            return customerDiscounts.Select(cd => cd.DiscountId).ToList();
        }
    }
}

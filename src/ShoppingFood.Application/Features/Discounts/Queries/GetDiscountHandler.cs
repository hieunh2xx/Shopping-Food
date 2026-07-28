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
            
            var excludedDiscountIds = await GetExcludedDiscountIdsAsync(request.CurrentUserId);

            var filter = request.Filter?.ToLower();
            bool hasFilter = !string.IsNullOrEmpty(filter);

            if (!request.IncludeAll)
            {
                predicate = d => (!hasFilter || d.Code.ToLower().Contains(filter!) || d.Title.ToLower().Contains(filter!)) && 
                (request.IsSavedOnly || (
                    !d.IsDeleted &&
                    d.Status == DiscountStatus.Active &&
                    d.StartDate <= now && now <= d.EndDate &&
                    d.UsedCount < d.Quantity &&
                    !excludedDiscountIds.Contains(d.Id)
                ));
            }
            else 
            {
                predicate = d => (!d.IsDeleted || request.IsSavedOnly) && (!hasFilter || d.Code.ToLower().Contains(filter!) || d.Title.ToLower().Contains(filter!));
            }

            if (request.RestaurantId.HasValue)
            {
                var restId = request.RestaurantId.Value;
                
                if (request.CartAmount.HasValue)
                {
                    var amount = request.CartAmount.Value;

                    predicate = d =>
                        (!hasFilter || d.Code.ToLower().Contains(filter!) || d.Title.ToLower().Contains(filter!)) &&
                        (request.IsSavedOnly || (!d.IsDeleted && (request.IncludeAll || (
                            d.Status == DiscountStatus.Active &&
                            d.StartDate <= now && now <= d.EndDate &&
                            d.UsedCount < d.Quantity &&
                            amount >= d.MinOrderAmount &&
                            !excludedDiscountIds.Contains(d.Id)
                        )))) &&
                        (d.RestaurantId == restId || (!request.IncludeAll && d.RestaurantId == null));
                }
                else
                {
                    predicate = d =>
                        (!hasFilter || d.Code.ToLower().Contains(filter!) || d.Title.ToLower().Contains(filter!)) &&
                        (request.IsSavedOnly || (!d.IsDeleted && (request.IncludeAll || (
                            d.Status == DiscountStatus.Active &&
                            d.StartDate <= now && now <= d.EndDate &&
                            d.UsedCount < d.Quantity &&
                            !excludedDiscountIds.Contains(d.Id)
                        )))) &&
                        (d.RestaurantId == restId || (!request.IncludeAll && d.RestaurantId == null));
                }
            }

            var discounts = await _discountRepository.GetAsync(
                predicate: predicate,
                include: q => q.Include(d => d.Restaurant),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            IReadOnlyList<CustomerDiscount> savedCustomerDiscounts = Array.Empty<CustomerDiscount>();
            if (request.CurrentUserId.HasValue)
            {
                savedCustomerDiscounts = await _customerDiscountRepository.GetAsync(
                    predicate: cd => cd.UserAccountId == request.CurrentUserId.Value,
                    include: q => q.Include(cd => cd.Discount),
                    disableTracking: true
                );
            }
            var savedDiscountIds = savedCustomerDiscounts.Select(cd => cd.DiscountId).ToList();

            if (request.IsSavedOnly && request.CurrentUserId.HasValue)
            {
                discounts = discounts.Where(d => savedDiscountIds.Contains(d.Id)).ToList();
            }

            var total = discounts.Count();

            var dto = _mapper.Map<List<DiscountDto>>(discounts);
            foreach (var d in dto)
            {
                d.IsSaved = savedDiscountIds.Contains(d.Id);
                var cd = savedCustomerDiscounts.FirstOrDefault(x => x.DiscountId == d.Id);
                if (cd != null && cd.UsageCount >= d.MaxUsagePerUser)
                {
                    d.IsUsedUp = true;
                }
            }
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

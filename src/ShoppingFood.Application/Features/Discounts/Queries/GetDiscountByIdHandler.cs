using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Discount;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Queries
{
    public class GetDiscountByIdHandler : IRequestHandler<GetDiscountByIdQuery, ApiResponse>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly IMapper _mapper;

        public GetDiscountByIdHandler(
            IDiscountRepository discountRepository, 
            IMapper mapper) 
        {
            _discountRepository = discountRepository;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(GetDiscountByIdQuery request, CancellationToken cancellationToken)
        {
            var discounts = await _discountRepository.GetAsync(
                predicate: d => d.Id == request.Id && !d.IsDeleted,
                disableTracking: true
                );
            var discount = discounts.FirstOrDefault();
            if (discount == null)
                return ApiResponse.Failure(404, "Discount code not found.");

            var dto = _mapper.Map<DiscountDto>(discount);
            return ApiResponse.Success(dto, "Retrieved discount detail successfully.");
        }
    }
}

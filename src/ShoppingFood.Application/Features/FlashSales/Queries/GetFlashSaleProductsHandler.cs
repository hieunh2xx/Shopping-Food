using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.FlashSale;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Queries
{
    public class GetFlashSaleProductsHandler : IRequestHandler<GetFlashSaleProductsQuery, ApiResponse>
    {
        private readonly IFlashSaleProductRepository _flashSaleProductRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetFlashSaleProductsHandler(
            IFlashSaleProductRepository flashSaleProductRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _flashSaleProductRepository = flashSaleProductRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetFlashSaleProductsQuery request, CancellationToken cancellationToken)
        {

            var products = await _flashSaleProductRepository.GetAsync(
                predicate: fsp => fsp.FlashSaleId == request.FlashSaleId && 
                                  (!request.CurrentUserId.HasValue ? fsp.Status == ShoppingFood.Domain.Enums.FlashSaleProductStatus.Approved : true) &&
                                  (!request.RestaurantId.HasValue || fsp.Product.RestaurantId == request.RestaurantId.Value),
                include: q => q.Include(fsp => fsp.Product).ThenInclude(p => p.Restaurant),
                orderBy: q => q.OrderByDescending(fsp => fsp.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            var total = await _flashSaleProductRepository.GetCountAsync(
                predicate: fsp => fsp.FlashSaleId == request.FlashSaleId && 
                                  (!request.CurrentUserId.HasValue ? fsp.Status == ShoppingFood.Domain.Enums.FlashSaleProductStatus.Approved : true) &&
                                  (!request.RestaurantId.HasValue || fsp.Product.RestaurantId == request.RestaurantId.Value)
                );

            var dtos = _mapper.Map<List<FlashSaleProductDto>>(products);
            
            var result = new
            {
                Total = total,
                Data = dtos
            };

            return ApiResponse.Success(result, "Flash sale products retrieved successfully.");
        }
    }
}

using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Dto.Restaurant;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Restaurants.Queries
{
    public class GetRestaurantDetailHandler : IRequestHandler<GetRestaurantDetailQuery, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;

        public GetRestaurantDetailHandler(
            IRestaurantProfileRepository restaurantProfileRepository,
            IProductRepository productRepository,
            IMapper mapper)
        {
            _restaurantProfileRepository = restaurantProfileRepository;
            _productRepository = productRepository;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(GetRestaurantDetailQuery request, CancellationToken cancellationToken)
        {
            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.Id == request.Id,
                disableTracking: true
                );

            var restaurant = restaurants.FirstOrDefault();

            if (restaurant == null)
                return ApiResponse.Failure(404, "Restaurant was not found");

            if(restaurant.Status != RestaurantStatus.Active)
                return ApiResponse.Failure(403, "Restaurant is currently inactive or suspended.");

            var restaurantDto = _mapper.Map<RestaurantProfileDto>(restaurant);

            var products = await GetApprovedProductsAsync(request.Id);
            restaurantDto.Products = _mapper.Map<System.Collections.Generic.List<ProductDto>>(products);
            return ApiResponse.Success(restaurantDto, "Restaurant detail retrieved successfully.");
        }

        private async Task<IReadOnlyList<Product>> GetApprovedProductsAsync(Guid restaurantId)
        {
            return await _productRepository.GetAsync(
                predicate: p => p.RestaurantId == restaurantId &&
                                p.Status == ProductStatus.Approved &&
                                !p.IsHidden,
                include: q => q.Include(p => p.Images)
                               .Include(p => p.Category)
                               .Include(p => p.ProductToppings)
                                   .ThenInclude(pt => pt.Topping)
                               .Include(p => p.ProductSizes)
                               .Include(p => p.Reviews),
                disableTracking: true
            );
        }
    }
}

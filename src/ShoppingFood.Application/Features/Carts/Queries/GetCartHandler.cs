using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Cart;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.Application.Features.Carts.Queries
{
    public class GetCartHandler : IRequestHandler<GetCartQuery, ApiResponse>
    {
        private readonly ICartRepository _cartRepository;
        private readonly IMapper _mapper;
        private readonly IFlashSalePricingService _flashSalePricingService;
        private readonly IUnitOfWork _unitOfWork;

        public GetCartHandler(
            ICartRepository cartRepository,
            IMapper mapper,
            IFlashSalePricingService flashSalePricingService,
            IUnitOfWork unitOfWork) 
        {
            _cartRepository = cartRepository;
            _mapper = mapper;
            _flashSalePricingService = flashSalePricingService;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(GetCartQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if(!request.CurrentUserId.HasValue && !request.GuestUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized. Neither logged-in user nor guest ID was provided.");

                IReadOnlyList<Cart> carts;
                if (request.CurrentUserId.HasValue)
                {
                    carts = await _cartRepository.GetAsync(
                        predicate: c => c.UserAccountId == request.CurrentUserId.Value,
                        include: q => q.IgnoreQueryFilters().Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.ProductSizes).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.ProductToppings).ThenInclude(pt => pt.Topping),
                        disableTracking: false
                        );
                }
                else
                {
                    carts = await _cartRepository.GetAsync(
                        predicate: c => c.GuestUserId == request.GuestUserId.Value,
                        include: q => q.IgnoreQueryFilters().Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Restaurant).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.ProductSizes).Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.ProductToppings).ThenInclude(pt => pt.Topping),
                        disableTracking: false
                        );
                }
                var cart = carts.FirstOrDefault();
                if(cart == null)
                {
                    var emptyCartDto = new CartDto
                    {
                        Id = Guid.Empty,
                        UserAccountId = request.CurrentUserId,
                        Items = new List<CartItemDto>()
                    };
                    return ApiResponse.Success(emptyCartDto, "Cart is empty.");
                }

                await _flashSalePricingService.SyncCartItemPricesAsync(cart);
                await _unitOfWork.SaveChangesAsync();

                var dto = _mapper.Map<CartDto>(cart);
                return ApiResponse.Success(dto, "Get cart details successfully");

            }
            catch (Exception ex) 
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

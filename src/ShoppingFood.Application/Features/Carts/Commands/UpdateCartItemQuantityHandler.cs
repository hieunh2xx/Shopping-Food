using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Cart;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ShoppingFood.Application.Interfaces;

namespace ShoppingFood.Application.Features.Carts.Commands
{
    public class UpdateCartItemQuantityHandler : IRequestHandler<UpdateCartItemQuantityCommand, ApiResponse>
    {
        private readonly ICartRepository _cartRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IFlashSalePricingService _flashSalePricingService;

        public UpdateCartItemQuantityHandler(
            ICartRepository cartRepository,
            ICartItemRepository cartItemRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IFlashSalePricingService flashSalePricingService)
        {
            _cartRepository = cartRepository;
            _cartItemRepository = cartItemRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _flashSalePricingService = flashSalePricingService;
        }
        public async Task<ApiResponse> Handle(UpdateCartItemQuantityCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if(!request.CurrentUserId.HasValue && !request.GuestUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized. Neither logged-in user nor guest ID was provided.");
                
                var cart = await GetCartAsync(request.CurrentUserId, request.GuestUserId);
                if(cart == null)
                    return ApiResponse.Failure(404, "Cart not found.");

                var cartItem = await GetCartItemAsync(cart.Id, request.ProductId);
                if(cartItem == null)
                    return ApiResponse.Failure(404, "Item not found in cart.");

                if(request.Quantity <= 0)
                {
                    if (cartItem.BuyXGetYPromotionId.HasValue && !cartItem.IsGift)
                    {
                        var gifts = await _cartItemRepository.GetAsync(
                            predicate: i => i.ParentCartItemId == cartItem.Id,
                            disableTracking: false);
                        foreach (var g in gifts) _cartItemRepository.Delete(g);
                    }
                    _cartItemRepository.Delete(cartItem);
                }
                else if (cartItem.BuyXGetYPromotionId.HasValue && !cartItem.IsGift)
                {
                    // Quantity trên parent = số món mua (buyQuantity * sets). Đồng bộ món tặng.
                    var promos = await _cartItemRepository.GetAsync(
                        predicate: i => i.Id == cartItem.Id,
                        include: q => q.Include(i => i.BuyXGetYPromotion),
                        disableTracking: false);
                    var parent = promos.FirstOrDefault() ?? cartItem;
                    var buyPerSet = parent.BuyXGetYPromotion?.BuyQuantity ?? 1;
                    var giftPerSet = parent.BuyXGetYPromotion?.GiftQuantity ?? 0;
                    var sets = Math.Max(1, (int)Math.Ceiling(request.Quantity / (double)Math.Max(1, buyPerSet)));
                    parent.Quantity = buyPerSet * sets;
                    _cartItemRepository.Update(parent);

                    var gifts = await _cartItemRepository.GetAsync(
                        predicate: i => i.ParentCartItemId == parent.Id && i.IsGift,
                        disableTracking: false);
                    var giftItem = gifts.FirstOrDefault();
                    if (giftItem != null)
                    {
                        giftItem.Quantity = giftPerSet * sets;
                        giftItem.PriceAtAdded = 0;
                        _cartItemRepository.Update(giftItem);
                    }
                }
                else if (cartItem.IsGift)
                {
                    // Không cho sửa riêng món tặng — giữ nguyên
                }
                else
                {
                    var fspPrice = await _flashSalePricingService.GetActiveFlashSalePriceAsync(request.ProductId);
                    cartItem.Quantity = request.Quantity;
                    cartItem.PriceAtAdded = fspPrice ?? cartItem.Product?.Price ?? cartItem.PriceAtAdded;
                    _cartItemRepository.Update(cartItem);
                }

                await _unitOfWork.SaveChangesAsync();

                var dto = await GetCartDtoAsync(cart.Id);

                return ApiResponse.Success(dto, "Cart item quantity updated successfully.");

            } catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateCartItemQuantityHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<CartItem?> GetCartItemAsync(Guid cartId, Guid productId)
        {
            var existingCartItem = await _cartItemRepository.GetAsync(
                predicate: i => i.CartId == cartId && i.ProductId == productId,
                include: q => q.Include(i => i.Product).Include(i => i.BuyXGetYPromotion),
                disableTracking: false
            );
            // Ưu tiên dòng món mua (không phải gift) khi cùng productId
            return existingCartItem.FirstOrDefault(i => !i.IsGift) ?? existingCartItem.FirstOrDefault();
        }

        private async Task<CartDto?> GetCartDtoAsync(Guid cartId)
        {
            var updatedCarts = await _cartRepository.GetAsync(
                predicate: c => c.Id == cartId,
                include: q => q
                    .Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images)
                    .Include(c => c.Items).ThenInclude(i => i.BuyXGetYPromotion),
                disableTracking: true
            );
            var updatedCart = updatedCarts.FirstOrDefault();
            return _mapper.Map<CartDto>(updatedCart);
        }

        private async Task<Cart?> GetCartAsync(Guid? userId, Guid? guestUserId)
        {
            IReadOnlyList<Cart> carts;
            if (userId.HasValue)
            {
                carts = await _cartRepository.GetAsync(
                    predicate: c => c.UserAccountId == userId.Value,
                    disableTracking: false
                    );
            }
            else
            {
                carts = await _cartRepository.GetAsync(
                    predicate: c => c.GuestUserId == guestUserId.Value,
                    disableTracking: false
                    );
            }
            return carts.FirstOrDefault();
        }
    }
}

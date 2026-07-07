using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
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
    public class AddToCartHandler : IRequestHandler<AddToCartCommand, ApiResponse>
    {
        private readonly ICartRepository _cartRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ShoppingFoodContext _dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor; // Inject HttpContextAccessor
        private readonly IFlashSalePricingService _flashSalePricingService;

        public AddToCartHandler(
            ICartRepository cartRepository,
            ICartItemRepository cartItemRepository,
            IProductRepository productRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper, 
            ShoppingFoodContext dbContext,
            IHttpContextAccessor httpContextAccessor,
            IFlashSalePricingService flashSalePricingService)
        {
            _cartRepository = cartRepository;
            _cartItemRepository = cartItemRepository;
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _dbContext = dbContext;
            _httpContextAccessor = httpContextAccessor;
            _flashSalePricingService = flashSalePricingService;
        }

        public async Task<ApiResponse> Handle(AddToCartCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var guestUserId = request.GuestUserId;
                if (request.CurrentUserId == null && guestUserId == null)
                {
                    guestUserId = Guid.NewGuid();
                }

                var product = await _productRepository.GetByIdAsync(request.ProductId);
                if (product == null || product.Status != ProductStatus.Approved || product.IsHidden)
                    return ApiResponse.Failure(404, "Product not found or unavailable.");

                if (product.StockStatus != StockStatus.InStock)
                    return ApiResponse.Failure(400, "Product is out of stock.");

                var cart = await GetOrCreateCartAsync(request.CurrentUserId, guestUserId);

                var conflictResult = await ValidateRestaurantConflictAsync(cart, product, request.ClearCartIfConflict);
                if (conflictResult != null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return conflictResult;
                }

                await AddOrUpdateCartItemAsync(cart.Id, product, request.Quantity);

                await _unitOfWork.SaveChangesAsync();

                var dto = await GetCartDtoAsync(cart.Id);

                await transaction.CommitAsync(cancellationToken);

                return ApiResponse.Success(dto, "Added item to cart successfully");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                await _unitOfWork.LogErrorAsync("AddToCartHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ApiResponse> ValidateRestaurantConflictAsync(Cart cart, Product product, bool clearCartIfConflict)
        {
            var existingCartItems = await _cartItemRepository.GetAsync(
                predicate: i => i.CartId == cart.Id,
                include: q => q.Include(i => i.Product),
                disableTracking: false
                );

            if (existingCartItems.Any())
            {
                var existingRestaurantId = existingCartItems.First().Product!.RestaurantId;
                if (existingRestaurantId != product.RestaurantId)
                {
                    if (clearCartIfConflict) 
                        await ClearCartItemAsync(existingCartItems);
                    else 
                        return ApiResponse.Failure(409, "The item you selected is not from the same store as the items already in your cart. Would you like to empty your cart and add this new item?");
                }
            }
            return null;
        }

        private async Task ClearCartItemAsync(IEnumerable<CartItem> Items)
        {
            foreach (var item in Items)
            {
                _cartItemRepository.Delete(item);
            }
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<CartItem?> GetCartItemAsync(Guid cartId, Guid productId)
        {
            var existingCartItem = await _cartItemRepository.GetAsync(
                predicate: i => i.CartId == cartId && i.ProductId == productId,
                disableTracking: false
            );
            return existingCartItem.FirstOrDefault();
        }

        private async Task<CartDto?> GetCartDtoAsync(Guid cartId)
        {
            var updatedCarts = await _cartRepository.GetAsync(
                predicate: c => c.Id == cartId,
                include: q => q.Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images),
                disableTracking: true
            );
            var updatedCart = updatedCarts.FirstOrDefault();
            return _mapper.Map<CartDto>(updatedCart);
        }

        private string GetClientIpAddress()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return "127.0.0.1";

            if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                var ip = forwardedFor.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(ip)) return ip;
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        }
        private async Task<Cart> GetOrCreateCartAsync(Guid? userId, Guid? guestUserId)
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

            var cart = carts.FirstOrDefault();

            if (cart == null)
            {
                if (!userId.HasValue && guestUserId.HasValue)
                {
                    var guestUserExists = await _dbContext.GuestUsers.AnyAsync(g => g.Id == guestUserId.Value);
                    if (!guestUserExists)
                    {
                        var guestUser = new GuestUser
                        {
                            Id = guestUserId.Value,
                            FullName = "Guest Customer",
                            Phone = string.Empty,
                            DeliveryAddress = string.Empty,
                            IpAddress = GetClientIpAddress()
                        };
                        _dbContext.GuestUsers.Add(guestUser);
                        await _unitOfWork.SaveChangesAsync(); 
                    }
                }

                cart = new Cart
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = userId,
                    GuestUserId = userId.HasValue ? null : guestUserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _cartRepository.Add(cart);
                
                await _unitOfWork.SaveChangesAsync();
            }
            return cart;
        }

        private async Task AddOrUpdateCartItemAsync(Guid cartId, Product product, int quantity)
        {
            var flashSalePrice = await _flashSalePricingService.GetActiveFlashSalePriceAsync(product.Id);
            var effectivePrice = flashSalePrice ?? product.Price;

            var item = await GetCartItemAsync(cartId, product.Id);
            if (item != null)
            {
                item.Quantity += quantity;
                item.PriceAtAdded = effectivePrice; 
                _cartItemRepository.Update(item);
            }
            else
            {
                var newItem = new CartItem
                {
                    Id = Guid.NewGuid(),
                    CartId = cartId,
                    ProductId = product.Id,
                    Quantity = quantity,
                    PriceAtAdded = effectivePrice,
                    CreatedAt = DateTime.UtcNow
                }; 
                _cartItemRepository.Add(newItem);
            }
        }
    }
}

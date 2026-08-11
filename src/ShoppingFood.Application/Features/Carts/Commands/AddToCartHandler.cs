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
        private readonly IBuyXGetYPromotionRepository _promotionRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ShoppingFoodContext _dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IFlashSalePricingService _flashSalePricingService;

        public AddToCartHandler(
            ICartRepository cartRepository,
            ICartItemRepository cartItemRepository,
            IProductRepository productRepository,
            IBuyXGetYPromotionRepository promotionRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper, 
            ShoppingFoodContext dbContext,
            IHttpContextAccessor httpContextAccessor,
            IFlashSalePricingService flashSalePricingService)
        {
            _cartRepository = cartRepository;
            _cartItemRepository = cartItemRepository;
            _productRepository = productRepository;
            _promotionRepository = promotionRepository;
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

                if (request.BuyXGetYPromotionId.HasValue)
                {
                    var promoResult = await AddBuyXGetYBundleAsync(request, guestUserId, cancellationToken);
                    if (promoResult.Error || promoResult.Code >= 400)
                    {
                        await transaction.RollbackAsync(cancellationToken);
                        return promoResult;
                    }

                    await transaction.CommitAsync(cancellationToken);
                    return promoResult;
                }

                var products = await _productRepository.GetAsync(
                    predicate: p => p.Id == request.ProductId,
                    include: q => q.Include(p => p.ProductSizes).Include(p => p.ProductToppings).ThenInclude(pt => pt.Topping),
                    disableTracking: false
                );
                var product = products.FirstOrDefault();
                if (product == null || product.Status != ProductStatus.Approved || product.IsHidden)
                    return ApiResponse.Failure(404, "Product not found or unavailable.");

                if (!product.IsCurrentlyAvailable(DateTime.UtcNow))
                    return ApiResponse.Failure(400, "Món ăn này hiện chưa tới giờ mở bán.");

                if (product.StockStatus != StockStatus.InStock)
                    return ApiResponse.Failure(400, "Product is out of stock.");

                var cart = await GetOrCreateCartAsync(request.CurrentUserId, guestUserId);

                var conflictResult = await ValidateRestaurantConflictAsync(cart, product, request.ClearCartIfConflict);
                if (conflictResult != null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return conflictResult;
                }

                await AddOrUpdateCartItemAsync(cart.Id, product, request.Quantity, request.SelectedSize, request.SelectedToppings);

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

        private async Task<ApiResponse> AddBuyXGetYBundleAsync(AddToCartCommand request, Guid? guestUserId, CancellationToken cancellationToken)
        {
            var promoId = request.BuyXGetYPromotionId!.Value;
            var sets = Math.Max(1, request.Quantity);

            var promos = await _promotionRepository.GetAsync(
                predicate: p => p.Id == promoId,
                include: q => q
                    .Include(p => p.TriggerProduct).ThenInclude(tp => tp.ProductSizes)
                    .Include(p => p.TriggerProduct).ThenInclude(tp => tp.ProductToppings).ThenInclude(pt => pt.Topping)
                    .Include(p => p.GiftProduct).ThenInclude(gp => gp.Images),
                disableTracking: false);
            var promo = promos.FirstOrDefault();
            if (promo == null || !promo.IsActive)
                return ApiResponse.Failure(404, "Chương trình khuyến mãi không tồn tại hoặc đã tắt.");

            var now = DateTime.UtcNow;
            if (promo.StartDate > now || promo.EndDate < now)
                return ApiResponse.Failure(400, "Chương trình khuyến mãi chưa hiệu lực hoặc đã hết hạn.");

            var trigger = promo.TriggerProduct;
            var gift = promo.GiftProduct;
            if (trigger == null || gift == null)
                return ApiResponse.Failure(404, "Không tìm thấy món trong chương trình khuyến mãi.");

            if (trigger.Status != ProductStatus.Approved || trigger.IsHidden || trigger.StockStatus != StockStatus.InStock)
                return ApiResponse.Failure(400, "Món mua trong khuyến mãi không khả dụng.");
            if (gift.Status != ProductStatus.Approved || gift.IsHidden || gift.StockStatus != StockStatus.InStock)
                return ApiResponse.Failure(400, "Món tặng trong khuyến mãi không khả dụng.");
            if (!trigger.IsCurrentlyAvailable(now) || !gift.IsCurrentlyAvailable(now))
                return ApiResponse.Failure(400, "Món trong khuyến mãi hiện chưa tới giờ mở bán.");

            if (request.ProductId != Guid.Empty && request.ProductId != promo.TriggerProductId)
                return ApiResponse.Failure(400, "Sản phẩm không khớp chương trình Mua X Tặng Y.");

            var cart = await GetOrCreateCartAsync(request.CurrentUserId, guestUserId);
            var conflictResult = await ValidateRestaurantConflictAsync(cart, trigger, request.ClearCartIfConflict);
            if (conflictResult != null)
                return conflictResult;

            var buyQty = promo.BuyQuantity * sets;
            var giftQty = promo.GiftQuantity * sets;

            var existingParents = await _cartItemRepository.GetAsync(
                predicate: i => i.CartId == cart.Id
                    && i.BuyXGetYPromotionId == promoId
                    && !i.IsGift
                    && i.ProductId == promo.TriggerProductId,
                disableTracking: false);
            var parent = existingParents.FirstOrDefault();

            var flashSalePrice = await _flashSalePricingService.GetActiveFlashSalePriceAsync(trigger.Id);
            var triggerPrice = flashSalePrice ?? trigger.Price;

            if (parent != null)
            {
                parent.Quantity += buyQty;
                parent.PriceAtAdded = triggerPrice;
                _cartItemRepository.Update(parent);

                var gifts = await _cartItemRepository.GetAsync(
                    predicate: i => i.CartId == cart.Id && i.ParentCartItemId == parent.Id && i.IsGift,
                    disableTracking: false);
                var giftItem = gifts.FirstOrDefault();
                if (giftItem != null)
                {
                    giftItem.Quantity += giftQty;
                    giftItem.PriceAtAdded = 0;
                    _cartItemRepository.Update(giftItem);
                }
                else
                {
                    _cartItemRepository.Add(new CartItem
                    {
                        Id = Guid.NewGuid(),
                        CartId = cart.Id,
                        ProductId = gift.Id,
                        Quantity = giftQty,
                        PriceAtAdded = 0,
                        IsGift = true,
                        BuyXGetYPromotionId = promoId,
                        ParentCartItemId = parent.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else
            {
                var parentId = Guid.NewGuid();
                _cartItemRepository.Add(new CartItem
                {
                    Id = parentId,
                    CartId = cart.Id,
                    ProductId = trigger.Id,
                    Quantity = buyQty,
                    PriceAtAdded = triggerPrice,
                    IsGift = false,
                    BuyXGetYPromotionId = promoId,
                    CreatedAt = DateTime.UtcNow
                });
                _cartItemRepository.Add(new CartItem
                {
                    Id = Guid.NewGuid(),
                    CartId = cart.Id,
                    ProductId = gift.Id,
                    Quantity = giftQty,
                    PriceAtAdded = 0,
                    IsGift = true,
                    BuyXGetYPromotionId = promoId,
                    ParentCartItemId = parentId,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _unitOfWork.SaveChangesAsync();
            var dto = await GetCartDtoAsync(cart.Id);
            return ApiResponse.Success(dto, "Đã thêm khuyến mãi Mua X Tặng Y vào giỏ");
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

        private async Task<CartItem?> GetCartItemAsync(Guid cartId, Guid productId, string? selectedSize, string? selectedToppingsStr)
        {
            var existingCartItem = await _cartItemRepository.GetAsync(
                predicate: i => i.CartId == cartId
                    && i.ProductId == productId
                    && i.SelectedSize == selectedSize
                    && i.SelectedToppings == selectedToppingsStr
                    && i.BuyXGetYPromotionId == null
                    && !i.IsGift,
                disableTracking: false
            );
            return existingCartItem.FirstOrDefault();
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

        private async Task AddOrUpdateCartItemAsync(Guid cartId, Product product, int quantity, string? selectedSize, List<string>? selectedToppings)
        {
            var flashSalePrice = await _flashSalePricingService.GetActiveFlashSalePriceAsync(product.Id);
            decimal extraPrice = 0;
            if (!string.IsNullOrEmpty(selectedSize))
            {
                var size = product.ProductSizes.FirstOrDefault(s => s.SizeName.Equals(selectedSize, StringComparison.OrdinalIgnoreCase));
                if (size != null) extraPrice += size.ExtraPrice;
            }

            string? selectedToppingsStr = null;
            if (selectedToppings != null && selectedToppings.Any())
            {
                foreach (var toppingName in selectedToppings)
                {
                    var topping = product.ProductToppings.FirstOrDefault(pt => pt.Topping != null && pt.Topping.ToppingName.Equals(toppingName, StringComparison.OrdinalIgnoreCase))?.Topping;
                    if (topping != null) extraPrice += topping.Price;
                }
                selectedToppingsStr = string.Join(", ", selectedToppings);
            }

            var effectivePrice = (flashSalePrice ?? product.Price) + extraPrice;

            var item = await GetCartItemAsync(cartId, product.Id, selectedSize, selectedToppingsStr);
            if (item != null)
            {
                item.Quantity += quantity;
                item.PriceAtAdded = effectivePrice;
                item.ToppingAndSizeSurcharge = extraPrice;
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
                    ToppingAndSizeSurcharge = extraPrice,
                    SelectedSize = selectedSize,
                    SelectedToppings = selectedToppingsStr,
                    CreatedAt = DateTime.UtcNow
                }; 
                _cartItemRepository.Add(newItem);
            }
        }
    }
}

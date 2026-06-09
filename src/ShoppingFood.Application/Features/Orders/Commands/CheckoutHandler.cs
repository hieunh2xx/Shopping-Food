using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Net.WebRequestMethods;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class CheckoutHandler : IRequestHandler<CheckoutCommand, ApiResponse>
    {
        private readonly ICartRepository _cartRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IOtpRecordRepository _otpRecordRepository;
        private readonly IGuestUserRepository _guestUserRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ShoppingFoodContext _dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;



        public CheckoutHandler(
            ICartRepository cartRepository,
            ICartItemRepository cartItemRepository,
            IOrderRepository orderRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IOtpRecordRepository otpRecordRepository,
            IGuestUserRepository guestUserRepository,
            IUnitOfWork unitOfWork,
            ShoppingFoodContext dbContext,
            IHttpContextAccessor httpContextAccessor
            )
        {
            _cartRepository = cartRepository;
            _cartItemRepository = cartItemRepository;
            _orderRepository = orderRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _otpRecordRepository = otpRecordRepository;
            _guestUserRepository = guestUserRepository;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<ApiResponse> Handle(CheckoutCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                if(!request.CurrentUserId.HasValue && !request.GuestUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var clientIp = GetClientIpAddress();

                if (!request.CurrentUserId.HasValue)
                {
                    var isLocked = await _otpRecordRepository.ExistsAsync(
                        o => o.IpAddress == clientIp &&
                        o.RetriesCount >= 3 &&
                        o.CreatedAt >= DateTime.UtcNow.AddMinutes(-15)
                    );
                    if (isLocked)
                        return ApiResponse.Failure(403, "Checkout is temporarily locked due to too many failed OTP attempts.");

                    var guestOrdersCount = await _orderRepository.GetCountAsync(
                        predicate: o => o.IpAddress == clientIp && o.GuestUserId != null && o.CreatedAt >= DateTime.UtcNow.AddDays(-1)
                    );
                    if (guestOrdersCount >= 3)
                        return ApiResponse.Failure(429, "Rate limit exceeded. Maximum of 3 guest orders allowed per 24 hours.");

                    var otpRecords = await _otpRecordRepository.GetAsync(
                        predicate: o => o.EmailOrPhone == request.ContactEmail && !o.IsUsed,
                        orderBy: q => q.OrderByDescending(o => o.CreatedAt),
                        disableTracking: false
                    );
                    var otpRecord = otpRecords.FirstOrDefault();
                    if (otpRecord == null)
                        return ApiResponse.Failure(400, "Invalid OTP.");
                    if (otpRecord.ExpiryTime < DateTime.UtcNow)
                        return ApiResponse.Failure(400, "OTP has expired.");
                    if (otpRecord.OtpCode != request.OtpCode)
                    {
                        otpRecord.RetriesCount++;
                        _otpRecordRepository.Update(otpRecord);
                        await _unitOfWork.SaveChangesAsync();
                        if (otpRecord.RetriesCount >= 3)
                        {
                            await transaction.CommitAsync(cancellationToken);
                            return ApiResponse.Failure(403, "Invalid OTP. Checkout temporarily locked.");
                        }
                        await transaction.CommitAsync(cancellationToken);
                        return ApiResponse.Failure(400, $"Invalid OTP. You have {3 - otpRecord.RetriesCount} retries remaining.");
                    }
                    otpRecord.IsUsed = true;
                    _otpRecordRepository.Update(otpRecord);

                    if (request.GuestUserId.HasValue)
                    {
                        var guestUser = await _guestUserRepository.GetByIdAsync(request.GuestUserId.Value);
                        if (guestUser != null)
                        {
                            guestUser.FullName = request.ContactName;
                            guestUser.Phone = request.ContactPhone;
                            guestUser.Email = request.ContactEmail;
                            guestUser.DeliveryAddress = request.DeliveryAddress;
                            guestUser.IpAddress = clientIp;
                            _guestUserRepository.Update(guestUser);
                        }
                    }
                }

                var cart = await GetCartWithItemsAsync(request.CurrentUserId, request.GuestUserId);
                if (cart == null || !cart.Items.Any())
                    return ApiResponse.Failure(400, "Your cart is empty.");

                var stockValidationResult = ValidateCartStock(cart.Items);
                if (stockValidationResult != null)
                    return stockValidationResult;

                var totalAmount = await CalculateTotalAmountAsync(cart.Items);

                var order = CreateOrderEntity(request, totalAmount);
                PopulateOrderItems(order, cart.Items);

                _orderRepository.Add(order);
                await _unitOfWork.SaveChangesAsync();

                ClearCartItems(cart.Items);
                await _unitOfWork.SaveChangesAsync();

                await transaction.CommitAsync(cancellationToken);

                return ApiResponse.Success(new { OrderId = order.Id, totalAmount = order.TotalAmount }, "Checkout successful.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                await _unitOfWork.LogErrorAsync("CheckoutHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<Cart?> GetCartWithItemsAsync(Guid? userId, Guid? guestUserId)
        {
            IReadOnlyList<Cart> carts;
            if (userId.HasValue)
            {
                carts = await _cartRepository.GetAsync(
                    predicate: c => c.UserAccountId == userId.Value,
                    include: q => q.Include(c => c.Items).ThenInclude(i => i.Product),
                    disableTracking: false
                    );
            }
            else
            {
                carts = await _cartRepository.GetAsync(
                    predicate: c => c.GuestUserId == guestUserId.Value,
                    include: q => q.Include(c => c.Items).ThenInclude(i => i.Product),
                    disableTracking: false
                    );
            }
            return carts.FirstOrDefault();
        }

        private ApiResponse? ValidateCartStock(IEnumerable<CartItem> items)
        {
            foreach (var item in items)
            {
                if (item.Product == null || item.Product.IsHidden || item.Product.Status != ProductStatus.Approved)
                    return ApiResponse.Failure(400, $"The {item.Product?.ItemName} is currently not available for purchase.");
                if (item.Product.StockStatus != StockStatus.InStock)
                    return ApiResponse.Failure(400, $"The {item.Product.ItemName} is currently out of stock.");
            }
            return null;
        }

        private async Task<decimal> CalculateTotalAmountAsync(IEnumerable<CartItem> items)
        {
            var itemsList = items.ToList();

            decimal itemsTotal = itemsList.Sum(i => i.PriceAtAdded * i.Quantity);

            var restaurantIds = itemsList.Select(i => i.Product.RestaurantId).Distinct().ToList();
            decimal shippingFeeTotal = 0;

            foreach (var restaurantId in restaurantIds)
            {
                bool hasFreeshipProduct = itemsList.Any(i => i.Product!.RestaurantId == restaurantId && i.Product.IsFreeship);
                if (hasFreeshipProduct)
                    continue;

                var restaurant = await _restaurantProfileRepository.GetByIdAsync(restaurantId);
                if (restaurant != null)
                    shippingFeeTotal += restaurant.ShippingFee;
            }
            return itemsTotal + shippingFeeTotal;
        }

        private Order CreateOrderEntity(CheckoutCommand request, decimal totalAmount)
        {
            return new Order
            {
                Id = Guid.NewGuid(),
                UserAccountId = request.CurrentUserId,
                GuestUserId = request.CurrentUserId.HasValue ? null : request.GuestUserId,
                TotalAmount = totalAmount,
                DeliveryAddress = request.DeliveryAddress,
                ContactName = request.ContactName,
                ContactPhone = request.ContactPhone,
                PaymentMethod = request.PaymentMethod,
                Note = request.Note,
                Status = OrderStatus.Pending,
                IpAddress = GetClientIpAddress(),
                DeliveryLatitude = request.DeliveryLatitude,
                DeliveryLongitude = request.DeliveryLongitude,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
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

        private void PopulateOrderItems(Order order, IEnumerable<CartItem> cartItems)
        {
            foreach (var cartItem in cartItems)
            {
                var orderItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ProductId = cartItem.ProductId,
                    ItemName = cartItem.Product!.ItemName,
                    Quantity = cartItem.Quantity,
                    UnitPrice = cartItem.PriceAtAdded,
                    TotalPrice = cartItem.PriceAtAdded * cartItem.Quantity
                };
                order.Items.Add(orderItem);
            }
        }

        private void ClearCartItems(IEnumerable<CartItem> cartItems)
        {
            foreach (var item in cartItems)
            {
                _cartItemRepository.Delete(item);
            }
        }
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ReorderHandler : IRequestHandler<ReorderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICartRepository _cartRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ReorderHandler(
            IOrderRepository orderRepository,
            ICartRepository cartRepository,
            ICartItemRepository cartItemRepository,
            IProductRepository productRepository,
            IUnitOfWork unitOfWork
            ) 
        {
            _orderRepository = orderRepository;
            _cartRepository = cartRepository;
            _cartItemRepository = cartItemRepository;
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(ReorderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized");

                var oldOrder = await GetOldOrderWithItemsAsync(request.OrderId);
                if (oldOrder == null)
                    return ApiResponse.Failure(404, "Order not found");

                if (oldOrder.UserAccountId != request.CurrentUserId.Value)
                    return ApiResponse.Failure(403, "You do not have permission to reorder this order");

                var cart = await GetOrCreateUserCartAsync(request.CurrentUserId.Value);

                await ClearCartItemsAsync(cart);

                var addedItems = new List<string>();
                var skippedItems = new List<string>();

                await CopyItemsToCartAsync(cart, oldOrder.Items, addedItems, skippedItems);

                if (!addedItems.Any())
                    return ApiResponse.Failure(400, "None of the items from the previous order are available for reorder");

                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new
                {
                    AddedItems = addedItems,
                    SkippedItems = skippedItems
                }, "Reorder successful");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ReorderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
        private async Task<Order?> GetOldOrderWithItemsAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items),
                disableTracking: true
                );
            return orders.FirstOrDefault();
        }

        private async Task<Cart> GetOrCreateUserCartAsync(Guid userId)
        {
            var carts = await _cartRepository.GetAsync(
                predicate: c => c.UserAccountId == userId,
                include: q => q.Include(c => c.Items),
                disableTracking: false
                );
            var cart = carts.FirstOrDefault();

            if(cart == null)
            {
                cart = new Cart
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _cartRepository.Add(cart);
                await _unitOfWork.SaveChangesAsync();
            }
            return cart;
        }

        private async Task ClearCartItemsAsync(Cart cart)
        {
            if(cart.Items != null && cart.Items.Any())
            {
                foreach(var item in cart.Items)
                {
                    _cartItemRepository.Delete(item);
                }
                await _unitOfWork.SaveChangesAsync();
            }
        }

        private async Task CopyItemsToCartAsync(Cart cart, IEnumerable<OrderItem> oldItems, List<string> addedItems, List<string> skippedItems)
        {
            foreach(var oldItem in oldItems)
            {
                if(!oldItem.ProductId.HasValue)
                {
                    skippedItems.Add(oldItem.ItemName);
                    continue;
                }
                var product = await _productRepository.GetByIdWithDetailsAsync(oldItem.ProductId.Value);

                if (product == null || product.IsHidden || product.Status != ProductStatus.Approved || product.StockStatus != StockStatus.InStock)
                {
                    skippedItems.Add(oldItem.ItemName);
                    continue;
                }

                if (product.Restaurant == null || !product.Restaurant.IsCurrentlyOpen(DateTime.UtcNow) || !product.IsCurrentlyAvailable(DateTime.UtcNow))
                {
                    skippedItems.Add(oldItem.ItemName);
                    continue;
                }

                var newCartItem = new CartItem
                {
                    Id = Guid.NewGuid(),
                    CartId = cart.Id,
                    ProductId = product.Id,
                    Quantity = oldItem.Quantity,
                    PriceAtAdded = product.Price,
                    CreatedAt = DateTime.UtcNow
                };
                _cartItemRepository.Add(newCartItem);
                addedItems.Add(product.ItemName);
            }
        }
    }
}

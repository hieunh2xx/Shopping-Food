using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Services
{
    public class CartMergeService : ICartMergeService
    {
        private readonly ICartRepository _cartRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CartMergeService(
            ICartRepository cartRepository,
            ICartItemRepository cartItemRepository,
            IUnitOfWork unitOfWork)
        {
            _cartRepository = cartRepository;
            _cartItemRepository = cartItemRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task MergeGuestCartIntoUserAsync(Guid userId, Guid guestUserId, CancellationToken cancellationToken = default)
        {
            if (userId == Guid.Empty || guestUserId == Guid.Empty || userId == guestUserId)
                return;

            var guestCarts = await _cartRepository.GetAsync(
                predicate: c => c.GuestUserId == guestUserId,
                include: q => q.Include(c => c.Items).ThenInclude(i => i.Product),
                disableTracking: false
            );
            var guestCart = guestCarts.FirstOrDefault();
            if (guestCart == null || guestCart.Items == null || !guestCart.Items.Any())
                return;

            var userCarts = await _cartRepository.GetAsync(
                predicate: c => c.UserAccountId == userId,
                include: q => q.Include(c => c.Items).ThenInclude(i => i.Product),
                disableTracking: false
            );
            var userCart = userCarts.FirstOrDefault();

            if (userCart == null)
            {
                userCart = new Cart
                {
                    Id = Guid.NewGuid(),
                    UserAccountId = userId,
                    GuestUserId = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _cartRepository.Add(userCart);
                await _unitOfWork.SaveChangesAsync();
            }

            // Same-restaurant only: if both carts have items from different restaurants, prefer guest (clear user)
            if (userCart.Items.Any() && guestCart.Items.Any())
            {
                var userRestaurantId = userCart.Items.First().Product?.RestaurantId;
                var guestRestaurantId = guestCart.Items.First().Product?.RestaurantId;
                if (userRestaurantId.HasValue && guestRestaurantId.HasValue && userRestaurantId != guestRestaurantId)
                {
                    foreach (var existing in userCart.Items.ToList())
                    {
                        _cartItemRepository.Delete(existing);
                        userCart.Items.Remove(existing);
                    }
                    await _unitOfWork.SaveChangesAsync();
                }
            }

            foreach (var guestItem in guestCart.Items.ToList())
            {
                var match = userCart.Items.FirstOrDefault(i =>
                    i.ProductId == guestItem.ProductId &&
                    string.Equals(i.SelectedSize, guestItem.SelectedSize, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(i.SelectedToppings ?? string.Empty, guestItem.SelectedToppings ?? string.Empty, StringComparison.OrdinalIgnoreCase));

                if (match != null)
                {
                    match.Quantity += guestItem.Quantity;
                    match.PriceAtAdded = guestItem.PriceAtAdded;
                    match.ToppingAndSizeSurcharge = guestItem.ToppingAndSizeSurcharge;
                    _cartItemRepository.Update(match);
                    _cartItemRepository.Delete(guestItem);
                    guestCart.Items.Remove(guestItem);
                }
                else
                {
                    guestItem.CartId = userCart.Id;
                    _cartItemRepository.Update(guestItem);
                    userCart.Items.Add(guestItem);
                    guestCart.Items.Remove(guestItem);
                }
            }

            userCart.UpdatedAt = DateTime.UtcNow;
            _cartRepository.Update(userCart);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}

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
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Carts.Commands
{
    public class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, ApiResponse>
    {
        private readonly ICartRepository _cartRepository;
        private readonly ICartItemRepository _cartItemRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ClearCartCommandHandler(
            ICartRepository cartRepository,
            ICartItemRepository cartItemRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _cartRepository = cartRepository;
            _cartItemRepository = cartItemRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(ClearCartCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue && !request.GuestUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized. Neither logged-in user nor guest ID was provided.");

                var cart = await GetCartAsync(request.CurrentUserId, request.GuestUserId);
                if (cart == null)
                    return ApiResponse.Failure(404, "Cart not found.");

                var items = await _cartItemRepository.GetAsync(
                    predicate: i => i.CartId == cart.Id,
                    disableTracking: false
                );

                foreach (var item in items)
                {
                    _cartItemRepository.Delete(item);
                }

                await _unitOfWork.SaveChangesAsync();

                var updatedCarts = await _cartRepository.GetAsync(
                    predicate: c => c.Id == cart.Id,
                    include: q => q.Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images),
                    disableTracking: true
                );
                var updatedCart = updatedCarts.FirstOrDefault();
                var dto = _mapper.Map<CartDto>(updatedCart);

                return ApiResponse.Success(dto, "Cart cleared successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ClearCartCommandHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
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

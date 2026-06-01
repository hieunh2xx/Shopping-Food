using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateOrderHandler : IRequestHandler<UpdateOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateOrderHandler(
            IOrderRepository orderRepository,
            IUnitOfWork unitOfWork
            )
        {
            _orderRepository = orderRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(UpdateOrderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(request.OrderId);
                if(order == null) 
                    return ApiResponse.Failure(404, "Order not found");

                if(order.Status != OrderStatus.Pending)
                    return ApiResponse.Failure(400, "Only pending orders can be updated");

                if (order.UserAccountId.HasValue)
                {
                    if(!request.CurrentUserId.HasValue || order.UserAccountId.Value != request.CurrentUserId.Value)
                        return ApiResponse.Failure(403, "You are not authorized to update this order");
                }
                else if(order.GuestUserId.HasValue)
                {
                    if (!request.GuestUserId.HasValue || order.GuestUserId.Value != request.GuestUserId.Value)
                        return ApiResponse.Failure(403, "You are not authorized to update this order");
                }
                else
                    return ApiResponse.Failure(403, "Invalid order data");

                order.DeliveryAddress = request.DeliveryAddress;
                order.ContactName = request.ContactName;
                order.ContactPhone = request.ContactPhone;
                order.Note = request.Note;
                order.UpdatedAt = DateTime.UtcNow;

                _orderRepository.Update(order);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Order updated successfully");

            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateOrderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

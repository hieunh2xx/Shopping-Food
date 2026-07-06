using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class CancelOrderHandler : IRequestHandler<CancelOrderCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IPaymentSettlementService _paymentSettlementService;
        private readonly IUnitOfWork _unitOfWork;

        public CancelOrderHandler(
            IOrderRepository orderRepository,
            IPaymentSettlementService paymentSettlementService,
            IUnitOfWork unitOfWork) 
        {
            _orderRepository = orderRepository;
            _paymentSettlementService = paymentSettlementService;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(request.OrderId);
                if(order == null)
                    return ApiResponse.Failure(404, "Order not found");

                if(order.Status != OrderStatus.Pending)
                    return ApiResponse.Failure(400, "Only pending orders can be cancelled");

                if (order.UserAccountId.HasValue)
                {
                    if(!request.CurrentUserId.HasValue || order.UserAccountId.Value != request.CurrentUserId.Value)
                        return ApiResponse.Failure(403, "You are not authorized to cancel this order");
                }
                else if (order.GuestUserId.HasValue)
                {
                    if(!request.GuestUserId.HasValue || order.GuestUserId.Value != request.GuestUserId.Value)
                        return ApiResponse.Failure(403, "You are not authorized to cancel this order");
                }
                else 
                    return ApiResponse.Failure(400, "Invalid order data");

                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;

                await _paymentSettlementService.ProcessRefundAsync(order);

                _orderRepository.Update(order);
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(null,"Order cancelled successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("CancelOrderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

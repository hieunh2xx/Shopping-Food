using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Toppings.Queries
{
    public class DeleteToppingHandler : IRequestHandler<DeleteToppingQuery, ApiResponse>
    {
        private readonly IToppingRepository _toppingRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteToppingHandler(IToppingRepository toppingRepository, IUnitOfWork unitOfWork)
        {
            _toppingRepository = toppingRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteToppingQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var toppings = await _toppingRepository.GetAsync(
                    predicate: t => t.Id == request.Id,
                    include: q => q.Include(t => t.ProductToppings),
                    disableTracking: false
                );
                var topping = toppings.FirstOrDefault();

                if (topping == null)
                {
                    return ApiResponse.Failure(404, "Topping not found.");
                }

             
                topping.ProductToppings.Clear();

                _toppingRepository.Delete(topping);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Delete topping successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("DeleteToppingHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

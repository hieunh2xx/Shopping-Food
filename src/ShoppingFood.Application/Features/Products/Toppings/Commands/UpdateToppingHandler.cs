using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Toppings.Commands
{
    public class UpdateToppingHandler : IRequestHandler<UpdateToppingCommand, ApiResponse>
    {
        private readonly IToppingRepository _toppingRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdateToppingHandler(IToppingRepository toppingRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _toppingRepository = toppingRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(UpdateToppingCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var topping = await _toppingRepository.GetByIdAsync(request.Id);
                if (topping == null)
                {
                    return ApiResponse.Failure(404, "Topping not found.");
                }

                _mapper.Map(request, topping);
                _toppingRepository.Update(topping);
                await _unitOfWork.SaveChangesAsync();

                var toppingDto = _mapper.Map<ToppingDto>(topping);
                return ApiResponse.Success(toppingDto, "Update topping successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateToppingHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

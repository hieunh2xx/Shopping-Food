using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Toppings.Commands
{
    public class CreateToppingHandler : IRequestHandler<CreateToppingCommand, ApiResponse>
    {
        private readonly IToppingRepository _toppingRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateToppingHandler(IToppingRepository toppingRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _toppingRepository = toppingRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(CreateToppingCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var topping = _mapper.Map<Topping>(request);
                topping.Id = Guid.NewGuid();

                _toppingRepository.Add(topping);
                await _unitOfWork.SaveChangesAsync();

                var toppingDto = _mapper.Map<ToppingDto>(topping);
                return ApiResponse.Success(toppingDto, "Create topping successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("CreateToppingHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

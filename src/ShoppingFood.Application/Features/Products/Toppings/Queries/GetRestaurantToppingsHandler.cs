using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Toppings.Queries
{
    public class GetRestaurantToppingsHandler : IRequestHandler<GetRestaurantToppingsQuery, ApiResponse>
    {
        private readonly IToppingRepository _toppingRepository;
        private readonly IMapper _mapper;

        public GetRestaurantToppingsHandler(IToppingRepository toppingRepository, IMapper mapper)
        {
            _toppingRepository = toppingRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetRestaurantToppingsQuery request, CancellationToken cancellationToken)
        {
            var toppings = await _toppingRepository.GetAsync(t => t.RestaurantId == request.RestaurantId);
            var toppingDtos = _mapper.Map<List<ToppingDto>>(toppings);

            return ApiResponse.Success(toppingDtos, "Retrieve toppings successfully.", toppingDtos.Count);
        }
    }
}

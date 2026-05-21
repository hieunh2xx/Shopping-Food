using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetCategoriesHandler : IRequestHandler<GetCategoriesQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;

        public GetCategoriesHandler(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task<ApiResponse> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
        {
            var categories = await _productRepository.GetCategoriesAsync();
            return ApiResponse.Success(categories);
        }
    }
}

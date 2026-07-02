using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductReviewsHandler : IRequestHandler<GetProductReviewsQuery, ApiResponse>
    {
        private readonly IProductReviewRepository _productReviewRepository;
        private readonly IMapper _mapper;

        public GetProductReviewsHandler(
            IProductReviewRepository productReviewRepository,
            IMapper mapper)
        {
            _productReviewRepository = productReviewRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetProductReviewsQuery request, CancellationToken cancellationToken)
        {
            var reviews = await _productReviewRepository.GetAsync(
                predicate: r => r.ProductId == request.ProductId,
                include: q => q.Include(r => r.UserProfile)
                               .Include(r => r.Product),
                orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
            );

            var total = await _productReviewRepository.GetCountAsync(
                predicate: r => r.ProductId == request.ProductId
            );

            var dtos = _mapper.Map<List<ProductReviewDto>>(reviews);
            return ApiResponse.Success(dtos, "Reviews retrieved successfully.", total);
        }
    }
}

using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.FlashSale;
using ShoppingFood.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Queries
{
    public class GetFlashSaleProductsHandler : IRequestHandler<GetFlashSaleProductsQuery, ApiResponse>
    {
        private readonly IFlashSaleProductRepository _flashSaleProductRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetFlashSaleProductsHandler(
            IFlashSaleProductRepository flashSaleProductRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _flashSaleProductRepository = flashSaleProductRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetFlashSaleProductsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != Domain.Enums.UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden. Only admin can access flash sale products management.");

            var products = await _flashSaleProductRepository.GetAsync(
                predicate: fsp => fsp.FlashSaleId == request.FlashSaleId,
                include: q => q.Include(fsp => fsp.Product).ThenInclude(p => p.Restaurant),
                orderBy: q => q.OrderByDescending(fsp => fsp.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            var total = await _flashSaleProductRepository.GetCountAsync(
                predicate: fsp => fsp.FlashSaleId == request.FlashSaleId
                );

            var dtos = _mapper.Map<List<FlashSaleProductDto>>(products);
            
            var result = new
            {
                Total = total,
                Data = dtos
            };

            return ApiResponse.Success(result, "Flash sale products retrieved successfully.");
        }
    }
}

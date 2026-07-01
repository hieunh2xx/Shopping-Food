using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.FlashSale;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Queries
{
    public class GetFlashSalesHandler : IRequestHandler<GetFlashSalesQuery, ApiResponse>
    {
        private readonly IFlashSaleRepository _flashSaleRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetFlashSalesHandler(
            IFlashSaleRepository flashSaleRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _flashSaleRepository = flashSaleRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetFlashSalesQuery request, CancellationToken cancellationToken)
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
                return ApiResponse.Failure(403, "Forbidden. Only admin can access flash sale management.");

            var flashSales = await _flashSaleRepository.GetAsync(
                predicate: fs => !fs.IsDeleted &&
                                (!request.Status.HasValue || fs.Status == request.Status.Value),
                orderBy: q => q.OrderByDescending(fs => fs.CreatedAt),
                skip: request.Skip,
                take: request.Take,
                disableTracking: true
                );

            var total = await _flashSaleRepository.GetCountAsync(
                predicate: fs => !fs.IsDeleted &&
                                (!request.Status.HasValue || fs.Status == request.Status.Value)
                );

            var dtos = _mapper.Map<List<FlashSaleDto>>(flashSales);
            return ApiResponse.Success(dtos, "Flash sales retrieved successfully.");
        }
    }
}

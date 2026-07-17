using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.User;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Queries
{
    public class GetMyApplicationsHandler : IRequestHandler<GetMyApplicationsQuery, ApiResponse>
    {
        private readonly ISellerApplicationRepository _sellerAppRepo;
        private readonly IShipperApplicationRepository _shipperAppRepo;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetMyApplicationsHandler(
            ISellerApplicationRepository sellerAppRepo,
            IShipperApplicationRepository shipperAppRepo,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _sellerAppRepo = sellerAppRepo;
            _shipperAppRepo = shipperAppRepo;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetMyApplicationsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized");

            var user = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile)
            );
            var profileId = user.FirstOrDefault()?.Profile?.Id;

            if (profileId == null)
                return ApiResponse.Failure(404, "User profile not found");

            var sellerApps = await _sellerAppRepo.GetAsync(
                predicate: a => a.UserProfileId == profileId.Value,
                orderBy: q => q.OrderByDescending(a => a.CreatedAt)
            );

            var shipperApps = await _shipperAppRepo.GetAsync(
                predicate: a => a.UserProfileId == profileId.Value,
                orderBy: q => q.OrderByDescending(a => a.CreatedAt)
            );

            var response = new MyApplicationsResponseDto
            {
                SellerApplications = _mapper.Map<List<SellerApplicationDto>>(sellerApps),
                ShipperApplications = _mapper.Map<List<ShipperApplicationDto>>(shipperApps)
            };

            return ApiResponse.Success(response);
        }
    }
}

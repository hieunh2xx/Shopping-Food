using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetShipperScheduleAndAreaHandler : IRequestHandler<GetShipperScheduleAndAreaQuery, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public GetShipperScheduleAndAreaHandler(
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(GetShipperScheduleAndAreaQuery request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only shippers can perform this action.");

                var workingSchedule = new List<WorkingScheduleItemDto>();
                if (!string.IsNullOrWhiteSpace(shipperProfile.WorkingSchedule))
                {
                    try
                    {
                        workingSchedule = JsonSerializer.Deserialize<List<WorkingScheduleItemDto>>(shipperProfile.WorkingSchedule) ?? new List<WorkingScheduleItemDto>();
                    }
                    catch (Exception ex)
                    {
                        await _unitOfWork.LogErrorAsync("GetShipperScheduleAndAreaHandler.DeserializeSchedule", ex);
                    }
                }

                var result = new ShipperScheduleAndAreaDto
                {
                    OperatingLatitude = shipperProfile.Latitude,
                    OperatingLongitude = shipperProfile.Longitude,
                    OperatingRadiusKm = shipperProfile.OperatingRadiusKm,
                    WorkingSchedule = workingSchedule
                };
                return ApiResponse.Success(result, "Successfully retrieved shipper schedule and operating area.");
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
            
        }

        private async Task<ShipperProfile?> GetActiveShipperProfileAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == userId,
                    include: q => q.Include(u => u.Profile)
                    );
            var userProfile = users.FirstOrDefault()?.Profile;

            if (userProfile == null || userProfile.Role != Domain.Enums.UserRole.Shipper)
                return null;

            var profiles = await _shipperProfileRepository.GetAsync(
                predicate: p => p.UserProfileId == userProfile.Id && p.Status == Domain.Enums.UserStatus.Active,
                disableTracking: false
                );
            return profiles.FirstOrDefault();
        }
    }
}

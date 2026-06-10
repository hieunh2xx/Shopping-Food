using Azure.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateShipperScheduleAndAreaHandler : IRequestHandler<UpdateShipperScheduleAndAreaCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateShipperScheduleAndAreaHandler(
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(UpdateShipperScheduleAndAreaCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only shippers can perform this action.");

                shipperProfile.OperatingLatitude = request.OperatingLatitude;
                shipperProfile.OperatingLongitude = request.OperatingLongitude;
                shipperProfile.OperatingRadiusKm = request.OperatingRadiusKm;

                if (request.WorkingSchedule != null && request.WorkingSchedule.Any())
                    shipperProfile.WorkingSchedule = JsonSerializer.Serialize(request.WorkingSchedule);
                else
                    shipperProfile.WorkingSchedule = null;

                shipperProfile.UpdatedAt = DateTime.UtcNow;

                _shipperProfileRepository.Update(shipperProfile);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Shipper schedule and operating area updated successfully.");

            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateShipperScheduleAndAreaHandler.Handle", ex);
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

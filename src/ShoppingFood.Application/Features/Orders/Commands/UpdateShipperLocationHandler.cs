using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateShipperLocationHandler : IRequestHandler<UpdateShipperLocationCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateShipperLocationHandler(
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(UpdateShipperLocationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                    );
                var userProfile = users.FirstOrDefault()?.Profile;

                if (userProfile == null || userProfile.Role != UserRole.Shipper)
                    return ApiResponse.Failure(403, "Forbidden. Only shippers can update coordinates.");

                var profiles = await _shipperProfileRepository.GetAsync(
                    predicate: p => p.UserProfileId == userProfile.Id && p.Status == UserStatus.Active,
                    disableTracking: false
                    );
                var shipperProfile = profiles.FirstOrDefault();

                if (shipperProfile == null)
                    return ApiResponse.Failure(404, "Shipper not found.");

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;

                _shipperProfileRepository.Update(shipperProfile);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new {shipperProfile.Latitude, shipperProfile.Longitude}, "Shipper location updated successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateShipperLocationHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

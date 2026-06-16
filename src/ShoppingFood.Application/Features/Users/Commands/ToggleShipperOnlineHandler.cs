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

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ToggleShipperOnlineHandler : IRequestHandler<ToggleShipperOnlineCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ToggleShipperOnlineHandler(
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(ToggleShipperOnlineCommand request, CancellationToken cancellationToken)
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
                    return ApiResponse.Failure(403, "Forbidden. Only shipper can toggle online status.");

                var profiles = await _shipperProfileRepository.GetAsync(
                    predicate: p => p.UserProfileId == userProfile.Id && p.Status == UserStatus.Active,
                    disableTracking: false
                    );
                var shipperProfile = profiles.FirstOrDefault();

                if (shipperProfile == null)
                    return ApiResponse.Failure(404, "Shipper profile not found.");

                if (shipperProfile.SuspendedUntil.HasValue)
                {
                    if (shipperProfile.SuspendedUntil.Value <= DateTime.UtcNow)
                    {
                        shipperProfile.SuspendedUntil = null;
                        shipperProfile.SuspendedReason = null;
                        _shipperProfileRepository.Update(shipperProfile);
                    }
                    else
                    {
                        var remainingTime = Math.Max(0, Math.Round((shipperProfile.SuspendedUntil.Value - DateTime.UtcNow).TotalMinutes));
                        return ApiResponse.Failure(403, $"Your account is temporarily suspended from accepting orders. Time remaining: {remainingTime} minutes. Reason: {shipperProfile.SuspendedReason}");
                    }
                }

                shipperProfile.IsOnline = request.IsOnline;
                shipperProfile.UpdatedAt = DateTime.UtcNow;

                _shipperProfileRepository.Update(shipperProfile);
                await _unitOfWork.SaveChangesAsync();

                string statusMessage = shipperProfile.IsOnline
                    ? "Shipper is now online and ready to receive orders."
                    : "Shipper is now offline.";

                return ApiResponse.Success(new { IsOnline = shipperProfile.IsOnline }, statusMessage);
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ToggleShipperOnlineHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}

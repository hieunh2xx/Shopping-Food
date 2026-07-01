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
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ApplyShipperHandler : IRequestHandler<ApplyShipperCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IShipperApplicationRepository _shipperApplicationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ApplyShipperHandler(
            IUserRepository userRepository,
            IShipperApplicationRepository shipperApplicationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _shipperApplicationRepository = shipperApplicationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ApplyShipperCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null)
                return ApiResponse.Failure(404, "User profile not found.");

            if (userProfile.Role != Domain.Enums.UserRole.Customer)
                return ApiResponse.Failure(403, "Only customer can apply to become a shipper.");

            var hasPendingApplication = await _shipperApplicationRepository.ExistsAsync(
                a => a.UserProfileId == userProfile.Id && a.Status == Domain.Enums.ApplicationStatus.Pending
                );
            if (hasPendingApplication)
                return ApiResponse.Failure(400, "You already have a pending shipper application.");

            var application = CreateApplication(userProfile.Id, request);
            _shipperApplicationRepository.Add(application);
            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(new {ApplicationId = application.Id}, "Shipper application submitted successfully. Pending admin review");
        }

        private ShipperApplication CreateApplication(Guid id, ApplyShipperCommand request)
        {
            return new ShipperApplication
            {
                Id = Guid.NewGuid(),
                UserProfileId = id,
                IdentityCardNumber = request.IdentityCardNumber,
                IdentityCardFrontUrl = request.IdentityCardFrontUrl,
                IdentityCardBackUrl = request.IdentityCardBackUrl,
                VehicleType = request.VehicleType,
                VehiclePlateNumber = request.VehiclePlateNumber,
                DriverLicenseUrl = request.DriverLicenseUrl,
                VehicleRegistrationUrl = request.VehicleRegistrationUrl,
                Status = Domain.Enums.ApplicationStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}

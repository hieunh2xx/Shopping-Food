using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpdateSellerApplicationHandler : IRequestHandler<UpdateSellerApplicationCommand, ApiResponse>
    {
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateSellerApplicationHandler(
            ISellerApplicationRepository sellerApplicationRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _sellerApplicationRepository = sellerApplicationRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }
        public async Task<ApiResponse> Handle(UpdateSellerApplicationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var userProfile = await GetUserProfileAsync(request.CurrentUserId.Value);
                if (userProfile == null)
                    return ApiResponse.Failure(404, "User profile not found.");

                var application = await GetApplicationAsync(request.Id);
                if (application == null)
                    return ApiResponse.Failure(404, "Seller application not found.");

                if (application.UserProfileId != userProfile.Id)
                    return ApiResponse.Failure(403, "Forbidden. You do not own this application.");

                if (application.Status == SellerApplicationStatus.Approved)
                    return ApiResponse.Failure(400, $"Cannot update application. Current status is {application.Status}.");

                UpdateApplicationEntity(application, request);

                _sellerApplicationRepository.Update(application);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, "Seller application updated and resubmitted successfully");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateSellerApplicationHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private void UpdateApplicationEntity(SellerApplication application, UpdateSellerApplicationCommand request)
        {
            application.BusinessName = request.BusinessName;
            application.BusinessAddress = request.BusinessAddress;
            application.BusinessLicenseUrl = request.BusinessLicenseUrl;
            application.ShopImageUrl = request.ShopImageUrl;
            application.ContactInfo = request.ContactInfo;
            application.Status = SellerApplicationStatus.Pending;
            application.RejectionReason = null;
            application.UpdatedAt = DateTime.UtcNow;
        }

        private async Task<SellerApplication?> GetApplicationAsync(Guid id)
        {
            var applications = await _sellerApplicationRepository.GetAsync(
                predicate: a => a.Id == id,
                disableTracking: false
                );
            return applications.FirstOrDefault();
        }

        private async Task<UserProfile?> GetUserProfileAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            return users.FirstOrDefault()?.Profile;
        }
    }
}

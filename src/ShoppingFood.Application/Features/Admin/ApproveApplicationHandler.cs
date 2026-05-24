using AutoMapper;
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

namespace ShoppingFood.Application.Features.Admin
{
    public class ApproveApplicationHandler : IRequestHandler<ApproveApplicationCommand, ApiResponse>
    {
        private readonly ISellerApplicationRepository _sellerApplicationRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ApproveApplicationHandler(
            ISellerApplicationRepository sellerApplicationRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork, IMapper mapper)
        {
            _sellerApplicationRepository = sellerApplicationRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(ApproveApplicationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "User is unauthorize.");
                var adminUser = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                    );
                var admin = adminUser.FirstOrDefault();

                if (admin?.Profile == null || admin.Profile.Role != UserRole.Admin)
                    return ApiResponse.Failure(403, "Forbidden. Only administrator can review seller application.");

                var applications = await _sellerApplicationRepository.GetAsync(
                    predicate: a => a.Id == request.ApplicationId,
                    include: q => q.Include(a => a.UserProfile).ThenInclude(p => p.UserAccount),
                    disableTracking: false
                    );
                var application = applications.FirstOrDefault();
                if (application == null)
                    return ApiResponse.Failure(400, $"Seller application with Id: '{request.ApplicationId}' was not found.");

                if (application.Status != SellerApplicationStatus.Pending)
                    return ApiResponse.Failure(400, $"Seller application is already processed. Current status: {application.Status}");

                if (request.IsApproved)
                {
                    application.Status = SellerApplicationStatus.Approved;
                    var restaurant = new RestaurantProfile
                    {
                        Id = Guid.NewGuid(),
                        SellerApplicationId = application.Id,
                        OwnerId = application.UserProfileId,
                        RestaurantName = application.BusinessName,
                        Address = application.BusinessAddress,
                        Phone = application.ContactInfo,
                        Email = application.UserProfile.UserAccount?.Email ?? string.Empty,
                        Status = RestaurantStatus.Active,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };
                    _restaurantProfileRepository.Add( restaurant );
                }
                else
                {
                    application.Status = SellerApplicationStatus.Rejected;
                    application.RejectionReason = request.RejectionReason;
                }

                application.ReviewedBy = admin.Profile.Id;
                application.ReviewedAt = DateTime.UtcNow;
                application.UpdatedAt = DateTime.UtcNow;

                await _unitOfWork.SaveChangesAsync();

                string statusMessage = request.IsApproved ? "Seller application has been approved and restaurant profile has been created."
                    : "Seller application has been rejected,";
                return ApiResponse.Success(null, statusMessage);
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ApproveApplicationHandler.Handle", ex);
                return ApiResponse.Failure(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}

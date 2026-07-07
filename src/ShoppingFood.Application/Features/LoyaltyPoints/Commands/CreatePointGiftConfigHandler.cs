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

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class CreatePointGiftConfigHandler : IRequestHandler<CreatePointGiftConfigCommand, ApiResponse>
    {
        private readonly IPointGiftConfigRepository _pointGiftConfigRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreatePointGiftConfigHandler(
            IPointGiftConfigRepository pointGiftConfigRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _pointGiftConfigRepository = pointGiftConfigRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(CreatePointGiftConfigCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            var config = new PointGiftConfig
            {
                Id = Guid.NewGuid(),
                DiscountId = request.DiscountId,
                PointRequired = request.PointRequired,
                IsActive = request.IsActive,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
            };

            _pointGiftConfigRepository.Add(config);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(config.Id, "Create point gift config successfully.");
        }
    }
}

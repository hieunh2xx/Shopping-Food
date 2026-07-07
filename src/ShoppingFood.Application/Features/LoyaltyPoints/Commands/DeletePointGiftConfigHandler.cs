using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class DeletePointGiftConfigHandler : IRequestHandler<DeletePointGiftConfigCommand, ApiResponse>
    {
        private readonly IPointGiftConfigRepository _pointGiftConfigRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeletePointGiftConfigHandler(
            IPointGiftConfigRepository pointGiftConfigRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _pointGiftConfigRepository = pointGiftConfigRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeletePointGiftConfigCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            var configs = await _pointGiftConfigRepository.GetAsync(
                predicate: p => p.Id == request.Id && !p.IsDeleted,
                disableTracking: false
                );
            var config = configs.FirstOrDefault();
            if (config == null)
                return ApiResponse.Failure(404, "Point gift config not found.");

            config.IsDeleted = true;
            config.DeletedAt = DateTime.UtcNow;

            _pointGiftConfigRepository.Update(config);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Delete point gift config successfully.");
        }
    }
}

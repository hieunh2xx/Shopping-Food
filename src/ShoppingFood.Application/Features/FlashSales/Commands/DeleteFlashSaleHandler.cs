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

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class DeleteFlashSaleHandler : IRequestHandler<DeleteFlashSaleCommand, ApiResponse>
    {
        private readonly IFlashSaleRepository _flashSaleRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteFlashSaleHandler(
            IFlashSaleRepository flashSaleRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _flashSaleRepository = flashSaleRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteFlashSaleCommand request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != Domain.Enums.UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden. Only admin can create flash sales.");

            var flashSales = await _flashSaleRepository.GetAsync(
                predicate: fs => fs.Id == request.Id && !fs.IsDeleted,
                disableTracking: false
                );
            var flashSale = flashSales.FirstOrDefault();
            if (flashSale == null)
                return ApiResponse.Failure(404, "Flash sale not found.");

            if(flashSale.Status == Domain.Enums.FlashSaleStatus.Active)
                return ApiResponse.Failure(400, "Cannot delete an active flash sale.");

            flashSale.IsDeleted = true;
            flashSale.DeletedAt = DateTime.UtcNow;

            _flashSaleRepository.Update(flashSale);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Flash sale deleted successfully.");
        }
    }
}

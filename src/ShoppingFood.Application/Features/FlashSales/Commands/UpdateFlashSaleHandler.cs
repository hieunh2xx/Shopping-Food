using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.FlashSale;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class UpdateFlashSaleHandler : IRequestHandler<UpdateFlashSaleCommand, ApiResponse>
    {
        private readonly IFlashSaleRepository _flashSaleRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdateFlashSaleHandler(
            IFlashSaleRepository flashSaleRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _flashSaleRepository = flashSaleRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(UpdateFlashSaleCommand request, CancellationToken cancellationToken)
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

            if(flashSale.Status == Domain.Enums.FlashSaleStatus.Active || flashSale.Status == Domain.Enums.FlashSaleStatus.Ended)
                return ApiResponse.Failure(400, $"Cannot update a flash sale with status '{flashSale.Status}'. Only Pending flash sales can be updated.");

            flashSale.Title = request.Title;
            flashSale.StartDate = request.StartDate;
            flashSale.EndDate = request.EndDate;

            _flashSaleRepository.Update(flashSale);
            await _unitOfWork.SaveChangesAsync();

            var dto = _mapper.Map<FlashSaleDto>(flashSale);
            return ApiResponse.Success(dto, "Flash sale updated successfully.");
        }
    }
}

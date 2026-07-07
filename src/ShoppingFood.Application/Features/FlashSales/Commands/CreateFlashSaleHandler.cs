using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.FlashSale;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class CreateFlashSaleHandler : IRequestHandler<CreateFlashSaleCommand, ApiResponse>
    {
        private readonly IFlashSaleRepository _flashSaleRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateFlashSaleHandler(
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

        public async Task<ApiResponse> Handle(CreateFlashSaleCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            var flashSale = new FlashSale
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = Domain.Enums.FlashSaleStatus.Pending,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };
            _flashSaleRepository.Add(flashSale);
            await _unitOfWork.SaveChangesAsync();

            var dto = _mapper.Map<FlashSaleDto>(flashSale);
            return ApiResponse.Success(dto, "Flash sale created successfully.");
        }
    }
}

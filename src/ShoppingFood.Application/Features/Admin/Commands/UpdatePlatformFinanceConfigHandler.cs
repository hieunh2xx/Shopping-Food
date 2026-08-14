using AutoMapper;
using MediatR;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdatePlatformFinanceConfigHandler : IRequestHandler<UpdatePlatformFinanceConfigCommand, PlatformFinanceConfigDto>
    {
        private readonly IPlatformFinanceConfigRepository _repository;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;

        public UpdatePlatformFinanceConfigHandler(IPlatformFinanceConfigRepository repository, IMapper mapper, IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
        }

        public async Task<PlatformFinanceConfigDto> Handle(UpdatePlatformFinanceConfigCommand request, CancellationToken cancellationToken)
        {
            var configs = await _repository.GetAllAsync();
            var config = configs.FirstOrDefault();
            
            if (config == null)
            {
                config = new PlatformFinanceConfig { Id = Guid.NewGuid() };
                _repository.Add(config);
            }

            config.CommissionRate = request.Config.CommissionRate;
            config.DefaultShipperDebtLimit = request.Config.DefaultShipperDebtLimit;
            config.BaseDeliveryFee = request.Config.BaseDeliveryFee;
            config.FeePerKm = request.Config.FeePerKm;
            config.RushHourMultiplier = request.Config.RushHourMultiplier;
            
            if (TimeSpan.TryParse(request.Config.RushHourStartTime, out var startTime))
                config.RushHourStartTime = startTime;
            if (TimeSpan.TryParse(request.Config.RushHourEndTime, out var endTime))
                config.RushHourEndTime = endTime;
                
            config.ShipperBaseFee = request.Config.ShipperBaseFee;
            config.ShipperFeePerKm = request.Config.ShipperFeePerKm;
            config.ShipperRushHourBonus = request.Config.ShipperRushHourBonus;
            config.MinWithdrawalAmount = request.Config.MinWithdrawalAmount;
            config.LargeWithdrawalThreshold = request.Config.LargeWithdrawalThreshold;
            config.SellerMaintenanceFee = request.Config.SellerMaintenanceFee;
            config.UpdatedAt = DateTime.UtcNow;

            _repository.Update(config);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<PlatformFinanceConfigDto>(config);
        }
    }
}

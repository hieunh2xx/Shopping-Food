using MediatR;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateLegalSettingsHandler : IRequestHandler<UpdateLegalSettingsCommand, ApiResponse>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateLegalSettingsHandler(ISystemConfigRepository systemConfigRepository, IUnitOfWork unitOfWork)
        {
            _systemConfigRepository = systemConfigRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(UpdateLegalSettingsCommand request, CancellationToken cancellationToken)
        {
            var configs = await _systemConfigRepository.GetAsync(c => c.Key == "LegalSettings");
            var config = configs.FirstOrDefault();
            
            var settingsDto = new LegalSettingsDto
            {
                TermsOfUseCustomer = request.TermsOfUseCustomer,
                TermsOfUseSeller = request.TermsOfUseSeller,
                TermsOfUseShipper = request.TermsOfUseShipper,
                PrivacyPolicy = request.PrivacyPolicy
            };
            var newValue = JsonSerializer.Serialize(settingsDto);

            if (config == null)
            {
                config = new SystemConfig
                {
                    Key = "LegalSettings",
                    Value = newValue,
                    Description = "Legal Settings (Terms of Use, Privacy Policy)"
                };
                _systemConfigRepository.Add(config);
            }
            else
            {
                config.Value = newValue;
                config.Description = "Legal Settings (Terms of Use, Privacy Policy)";
                _systemConfigRepository.Update(config);
            }

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success("Settings updated successfully");
        }
    }
}

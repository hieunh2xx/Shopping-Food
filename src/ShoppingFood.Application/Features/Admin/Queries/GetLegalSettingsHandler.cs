using MediatR;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Dto.System;
using ShoppingFood.Core.Base;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetLegalSettingsHandler : IRequestHandler<GetLegalSettingsQuery, ApiResponse>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;

        public GetLegalSettingsHandler(ISystemConfigRepository systemConfigRepository)
        {
            _systemConfigRepository = systemConfigRepository;
        }

        public async Task<ApiResponse> Handle(GetLegalSettingsQuery request, CancellationToken cancellationToken)
        {
            var configs = await _systemConfigRepository.GetAsync(c => c.Key == "LegalSettings");
            var config = configs.FirstOrDefault();
            
            var settingsDto = new LegalSettingsDto
            {
                TermsOfUse = "<h2>Điều khoản sử dụng</h2><p>Chưa có nội dung.</p>",
                PrivacyPolicy = "<h2>Chính sách bảo mật</h2><p>Chưa có nội dung.</p>"
            };

            if (config != null && !string.IsNullOrEmpty(config.Value))
            {
                var settings = JsonSerializer.Deserialize<LegalSettingsDto>(config.Value);
                if (settings != null)
                {
                    settingsDto = settings;
                }
            }

            return ApiResponse.Success(settingsDto);
        }
    }
}

using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateLegalSettingsCommand : IRequest<ApiResponse>
    {
        public string TermsOfUseCustomer { get; set; } = string.Empty;
        public string TermsOfUseSeller { get; set; } = string.Empty;
        public string TermsOfUseShipper { get; set; } = string.Empty;
        public string PrivacyPolicy { get; set; } = string.Empty;
    }
}

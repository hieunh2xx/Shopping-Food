using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class CreateBlacklistKeywordCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Keyword { get; set; } = string.Empty;
    }
}

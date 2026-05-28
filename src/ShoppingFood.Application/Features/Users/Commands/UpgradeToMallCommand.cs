using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpgradeToMallCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Reason { get; set; } = string.Empty;
    }
}

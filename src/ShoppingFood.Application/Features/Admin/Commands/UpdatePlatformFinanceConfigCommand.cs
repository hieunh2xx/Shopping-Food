using MediatR;
using ShoppingFood.Dto.Admin;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdatePlatformFinanceConfigCommand : IRequest<PlatformFinanceConfigDto>
    {
        public PlatformFinanceConfigDto Config { get; set; } = null!;
    }
}

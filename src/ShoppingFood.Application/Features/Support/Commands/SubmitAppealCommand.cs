using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Support.Commands
{
    public class SubmitAppealCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string Content { get; set; } = string.Empty;
    }
}

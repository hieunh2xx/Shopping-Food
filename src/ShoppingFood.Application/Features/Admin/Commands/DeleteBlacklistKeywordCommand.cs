using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class DeleteBlacklistKeywordCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
    }
}

using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class RequestUpdateContactCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string? NewEmail { get; set; }
        public string? NewPhone { get; set; }
        public string? IpAddress { get; set; }
    }
}

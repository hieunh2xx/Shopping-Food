using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class VerifyUpdateContactCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string? NewEmail { get; set; }
        public string? NewPhone { get; set; }
        public string OtpCode { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
    }
}

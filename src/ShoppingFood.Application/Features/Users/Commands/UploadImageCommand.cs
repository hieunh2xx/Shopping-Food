using MediatR;
using Microsoft.AspNetCore.Http;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UploadImageCommand : BaseCommand, IRequest<ApiResponse>
    {
        public IFormFile File { get; set; }
    }
}

using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ToggleShipperOnlineCommand : BaseCommand, IRequest<ApiResponse>
    {
        public bool IsOnline { get; set; }
    }
}

using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateShipperLocationCommand : BaseCommand, IRequest<ApiResponse>
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}

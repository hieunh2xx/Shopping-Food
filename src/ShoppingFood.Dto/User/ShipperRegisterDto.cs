using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.User
{
    public class ShipperRegisterDto
    {
        public Guid Id { get; set; }
        public Guid ShipperApplicationId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string ShipperApplicationStatus { get; set; } = string.Empty;
    }
}

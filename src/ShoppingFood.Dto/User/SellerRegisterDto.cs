using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.User
{
    public class SellerRegisterDto
    {
        public Guid Id { get; set; }
        public Guid SellerApplicationId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string BusinessName {  get; set; } = string.Empty;

        public string SellerApllicationStatus {  get; set; } = string.Empty;
    }
}

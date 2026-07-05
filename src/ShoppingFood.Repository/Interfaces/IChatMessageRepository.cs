using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Repository.Interfaces
{
    public interface IChatMessageRepository : IAsyncRepository<ChatMessage>
    {
    }
}

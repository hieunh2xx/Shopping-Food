using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Repository.Implementations
{
    public class RestaurantProfileRepository : RepositoryBase<RestaurantProfile>, IRestaurantProfileRepository
    {
        public RestaurantProfileRepository(DbContext dbContext) : base(dbContext)
        {
        }
    }
}


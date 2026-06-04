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
    public class OtpRecordRepository : RepositoryBase<OtpRecord>, IOtpRecordRepository
    {
        public OtpRecordRepository(DbContext dbContext) : base(dbContext)
        {
        }
    }
}

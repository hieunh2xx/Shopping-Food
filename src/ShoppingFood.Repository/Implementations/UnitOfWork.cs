using System;
using System.Threading.Tasks;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Repository.Implementations
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly LogContext _logContext;

        public UnitOfWork(ShoppingFoodContext dbContext, LogContext logContext)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _logContext = logContext ?? throw new ArgumentNullException(nameof(logContext));
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _dbContext.SaveChangesAsync();
        }

        public async Task LogErrorAsync(string action, Exception ex)
        {
            var errorLog = new ErrorLog
            {
                Id = Guid.NewGuid(),
                Action = action,
                ExceptionMessage = ex.Message,
                StackTrace = ex.StackTrace,
                CreatedAt = DateTime.UtcNow
            };
            
            _logContext.ErrorLogs.Add(errorLog);
            await _logContext.SaveChangesAsync();
        }

        public async Task LogActionAsync(IActionLog actionLog)
        {
            if (actionLog is ActionLog concreteLog)
            {
                _logContext.ActionLogs.Add(concreteLog);
            }
            else
            {
                var log = new ActionLog
                {
                    Id = actionLog.Id == Guid.Empty ? Guid.NewGuid() : actionLog.Id,
                    UserId = actionLog.UserId,
                    UserName = actionLog.UserName,
                    Action = actionLog.Action,
                    Message = actionLog.Message,
                    CreatedAt = actionLog.CreatedAt,
                    CreatedBy = actionLog.CreatedBy
                };
                _logContext.ActionLogs.Add(log);
            }
            
            await _logContext.SaveChangesAsync();
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _logContext.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}

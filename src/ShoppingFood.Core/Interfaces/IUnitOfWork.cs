using System;
using System.Threading.Tasks;

namespace ShoppingFood.Core.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        Task<int> SaveChangesAsync();
        Task LogErrorAsync(string action, Exception ex);
        Task LogActionAsync(IActionLog actionLog);
    }
}

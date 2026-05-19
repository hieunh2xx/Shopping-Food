using System;

namespace ShoppingFood.Core.Interfaces
{
    public interface IActionLog
    {
        Guid Id { get; set; }
        Guid? UserId { get; set; }
        string UserName { get; set; }
        string Action { get; set; }
        string Message { get; set; }
        DateTime CreatedAt { get; set; }
        Guid? CreatedBy { get; set; }
    }
}

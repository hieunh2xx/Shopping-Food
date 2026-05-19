using System;

namespace ShoppingFood.Core.Base
{
    public abstract class BaseCommand
    {
        public Guid? CurrentUserId { get; set; }
    }
}

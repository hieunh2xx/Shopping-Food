using System;

namespace ShoppingFood.Core.Base
{
    public abstract class BaseQuery
    {
        public Guid? CurrentUserId { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 10;
        public string? Filter { get; set; }
        public bool? IsCombo { get; set; }
    }
}

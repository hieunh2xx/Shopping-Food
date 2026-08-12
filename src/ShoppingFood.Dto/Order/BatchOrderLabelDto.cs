using System;

namespace ShoppingFood.Dto.Order
{
    /// <summary>
    /// One bag/order in a shipper pickup batch — for merchant & coordinator readout.
    /// </summary>
    public class BatchOrderLabelDto
    {
        public Guid OrderId { get; set; }
        /// <summary>First 8 chars of order id (uppercase) — write on bag.</summary>
        public string ShortCode { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
    }
}

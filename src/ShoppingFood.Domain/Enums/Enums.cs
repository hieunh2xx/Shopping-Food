namespace ShoppingFood.Domain.Enums
{
    public enum UserStatus
    {
        Pending,
        Active,
        Inactive,
        Blocked
    }

    public enum UserRole
    {
        Admin,
        Seller,
        Customer
    }

    public enum SellerApplicationStatus
    {
        Pending,
        Approved,
        Rejected,
        NeedsInfo
    }

    public enum RestaurantStatus
    {
        Active,
        Inactive,
        Suspended
    }

    public enum StockStatus
    {
        InStock,
        OutOfStock
    }

    public enum OrderStatus
    {
        Pending,
        Confirmed,
        Preparing,
        Shipping,
        Delivered,
        Cancelled
    }

    public enum PaymentMethod
    {
        COD,
        CreditCard,
        EWallet
    }
}

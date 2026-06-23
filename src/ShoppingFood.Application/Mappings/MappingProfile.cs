using AutoMapper;
using ShoppingFood.Application.Features.Discounts.Commands;
using ShoppingFood.Application.Features.Products.Commands;
using ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands;
using ShoppingFood.Application.Features.Products.Menu.Commands;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Cart;
using ShoppingFood.Dto.Coordinator;
using ShoppingFood.Dto.Discount;
using ShoppingFood.Dto.LoyaltyPoint;
using ShoppingFood.Dto.Order;
using ShoppingFood.Dto.Product;
using ShoppingFood.Dto.Promotion;
using ShoppingFood.Dto.Restaurant;
using ShoppingFood.Dto.User;
using System.Linq;

namespace ShoppingFood.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.FullName : string.Empty))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.Role.ToString() : string.Empty))
                .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.AvatarUrl : null))
                .ForMember(dest => dest.Gender, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.Gender : null))
                .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.DateOfBirth : null))
                .ReverseMap();

            CreateMap<AddUserCommand, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

            // Product mappings
            CreateMap<AddProductCommand, Product>()
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.ProductToppings, opt => opt.Ignore())
                .ForMember(dest => dest.ProductSizes, opt => opt.MapFrom(src => src.Sizes));

            CreateMap<UpdateProductCommand, Product>()
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.ProductToppings, opt => opt.Ignore())
                .ForMember(dest => dest.ProductSizes, opt => opt.MapFrom(src => src.Sizes));

            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.RestaurantName, opt => opt.MapFrom(src => src.Restaurant != null ? src.Restaurant.RestaurantName : string.Empty))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Title : string.Empty))
                .ForMember(dest => dest.PrimaryImageUrl, opt => opt.MapFrom(src => src.Images != null && src.Images.Any() ? src.Images.First().ImageUrl : null))
                .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images != null ? src.Images.Select(i => i.ImageUrl).ToList() : new System.Collections.Generic.List<string>()))
                .ForMember(dest => dest.Toppings, opt => opt.MapFrom(src => src.ProductToppings))
                .ForMember(dest => dest.Sizes, opt => opt.MapFrom(src => src.ProductSizes))
                .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src => src.Reviews != null && src.Reviews.Any() ? src.Reviews.Average(r => r.Rating) : 0.0))
                .ForMember(dest => dest.ReviewCount, opt => opt.MapFrom(src => src.Reviews != null ? src.Reviews.Count : 0))
                .ForMember(dest => dest.IsFreeship, opt => opt.MapFrom(src => src.IsFreeship))
                .ForMember(dest => dest.AvailableFrom, opt => opt.MapFrom(src => src.AvailableFrom.HasValue ? src.AvailableFrom.Value.ToString(@"hh\:mm") : null))
                .ForMember(dest => dest.AvailableTo, opt => opt.MapFrom(src => src.AvailableTo.HasValue ? src.AvailableTo.Value.ToString(@"hh\:mm") : null))
                .ForMember(dest => dest.IsAvailableNow, opt => opt.MapFrom(src => 
                (!src.AvailableFrom.HasValue || !src.AvailableTo.HasValue) || 
                (DateTime.UtcNow.TimeOfDay >= src.AvailableFrom.Value && DateTime.UtcNow.TimeOfDay <= src.AvailableTo.Value)))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<ProductTopping, ProductToppingDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.ToppingId))
                .ForMember(dest => dest.ToppingName, opt => opt.MapFrom(src => src.Topping != null ? src.Topping.ToppingName : string.Empty))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Topping != null ? src.Topping.Price : 0))
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Topping != null ? src.Topping.ImageUrl : null))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => src.Topping != null && src.Topping.IsAvailable));

            CreateMap<Topping, ToppingDto>().ReverseMap();
            CreateMap<Features.Products.Toppings.Commands.CreateToppingCommand, Topping>();
            CreateMap<Features.Products.Toppings.Commands.UpdateToppingCommand, Topping>();

            CreateMap<ProductSize, ProductSizeDto>().ReverseMap();

            // MenuCategory mappings
            CreateMap<AddMenuCategoryCommand, MenuCategory>();
            
            CreateMap<UpdateMenuCategoryCommand, MenuCategory>();
            
            CreateMap<MenuCategory, MenuCategoryDto>()
                .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count : 0));

            // GlobalMenuCategory mappings
            CreateMap<GlobalMenuCategory, GlobalMenuCategoryDto>().ReverseMap();
            CreateMap<AddGlobalMenuCategoryCommand, GlobalMenuCategory>().ReverseMap();
            CreateMap<UpdateGlobalMenuCategoryCommand, GlobalMenuCategory>().ReverseMap();

            //ProductReport mappings
            CreateMap<ProductReport, ProductReportDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ItemName : string.Empty))
                .ForMember(dest => dest.ReporterName, opt => opt.MapFrom(src => src.Reporter != null ? src.Reporter.FullName : string.Empty))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
            CreateMap<CreateProductReportCommand, ProductReport>();

            //RestaurantProfile mappings
            CreateMap<RestaurantProfile, RestaurantProfileDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.Products, opt => opt.Ignore());

            //FavoriteRestaurant mappings
            CreateMap<FavoriteRestaurant, FavoriteRestaurantDto>()
                .ForMember(dest => dest.RestaurantId, opt => opt.MapFrom(src => src.RestaurantId))
                .ForMember(dest => dest.RestaurantName, opt => opt.MapFrom(src => src.RestaurantProfile.RestaurantName))
                .ForMember(dest => dest.LogoUrl, opt => opt.MapFrom(src => src.RestaurantProfile.LogoUrl))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.RestaurantProfile.Address))
                .ForMember(dest => dest.FavoritedAt, opt => opt.MapFrom(src => src.RestaurantProfile.CreatedAt));

            //SellerApplication mappings
            CreateMap<SellerApplication, SellerApplicationStatusDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            //ProductReview mappings
            CreateMap<ProductReview, ProductReviewDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserProfile != null ? src.UserProfile.FullName : string.Empty))
                .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.UserProfile != null ? src.UserProfile.AvatarUrl : null));

            //CartItem and Cart mappings
            CreateMap<Cart, CartDto>();
            CreateMap<CartItem, CartItemDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ItemName : string.Empty))
                .ForMember(dest => dest.ProductImageUrl, opt => opt.MapFrom(src => src.Product != null && src.Product.Images != null && src.Product.Images.Any() ? src.Product.Images.First().ImageUrl : null));

            //ShipperApplication mappings
            CreateMap<RegisterShipperCommand, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

            CreateMap<RegisterShipperCommand, UserProfile>()
                .ForMember(dest => dest.Role, opt => opt.Ignore());

            CreateMap<RegisterShipperCommand, ShipperApplication>()
                .ForMember(dest => dest.Status, opt => opt.Ignore());

            CreateMap<Order, ProposedDeliveryOfferDto>()
                .ForMember(dest => dest.OrderId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.RestaurantName, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.RestaurantName : string.Empty))
                .ForMember(dest => dest.RestaurantAddress, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.Address : string.Empty))
                .ForMember(dest => dest.RestaurantPhone, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.Phone : string.Empty))
                .ForMember(dest => dest.RestaurantLatitude, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.Latitude : null))
                .ForMember(dest => dest.RestaurantLongitude, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.Longitude : null))
                .ForMember(dest => dest.DistanceInKm, opt => opt.Ignore())
                .ForMember(dest => dest.ShippingFee, opt => opt.Ignore())
                .ForMember(dest => dest.CountdownSeconds, opt => opt.MapFrom(src => 60));

            CreateMap<Order, DeliveryRouteDto>()
                .ForMember(dest => dest.OrderId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.ContactName))
                .ForMember(dest => dest.CustomerAddress, opt => opt.MapFrom(src => src.DeliveryAddress))
                .ForMember(dest => dest.CustomerPhone, opt => opt.MapFrom(src => src.ContactPhone))
                .ForMember(dest => dest.CustomerLatitude, opt => opt.MapFrom(src => src.DeliveryLatitude))
                .ForMember(dest => dest.CustomerLongitude, opt => opt.MapFrom(src => src.DeliveryLongitude))
                .ForMember(dest => dest.RestaurantName, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.RestaurantName : string.Empty))
                .ForMember(dest => dest.RestaurantAddress, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.Address : string.Empty))
                .ForMember(dest => dest.RestaurantLatitude, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.Latitude : null))
                .ForMember(dest => dest.RestaurantLongitude, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null && src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ? src.Items.FirstOrDefault().Product.Restaurant.Longitude : null))
                .ForMember(dest => dest.ShipperLatitude, opt => opt.Ignore())
                .ForMember(dest => dest.ShipperLongitude, opt => opt.Ignore())
                .ForMember(dest => dest.GoogleMapNavigationUrl, opt => opt.Ignore());

            CreateMap<Order, DispatchOrderDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod.ToString()))
                .ForMember(dest => dest.RestaurantName, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null &&
                            src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ?
                            src.Items.FirstOrDefault().Product.Restaurant.RestaurantName : "N/A"))
                .ForMember(dest => dest.RestaurantAddress, opt => opt.MapFrom(src => src.Items.FirstOrDefault() != null &&
                            src.Items.FirstOrDefault().Product != null && src.Items.FirstOrDefault().Product.Restaurant != null ?
                            src.Items.FirstOrDefault().Product.Restaurant.Address : "N/A"))
                .ForMember(dest => dest.ShipperName, opt => opt.MapFrom(src => src.Shipper != null && src.Shipper.UserProfile != null ? src.Shipper.UserProfile.FullName : null))
                .ForMember(dest => dest.ShipperPhone, opt => opt.MapFrom(src => src.Shipper != null && src.Shipper.UserProfile != null && src.Shipper.UserProfile.UserAccount != null ? src.Shipper.UserProfile.UserAccount.Phone : null))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

            CreateMap<OrderItem, DispatchOrderItemDto>();

            CreateMap<ShipperProfile, SuggestedShipperDto>()
                .ForMember(dest => dest.ShipperId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.UserProfile.FullName))
                .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.UserProfile.UserAccount.Phone ?? string.Empty))
                .ForMember(dest => dest.VehicleType, opt => opt.MapFrom(src => src.VehicleType.ToString()))
                .ForMember(dest => dest.DistanceInKm, otp => otp.Ignore());

            CreateMap<ShipperProfile, MonitorShipperDto>()
                .ForMember(dest => dest.ShipperId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.UserProfile.FullName))
                .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.UserProfile.UserAccount.Phone ?? string.Empty))
                .ForMember(dest => dest.VehicleType, opt => opt.MapFrom(src => src.VehicleType.ToString()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.IsBusy, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedOrderCount, opt => opt.Ignore());

            CreateMap<CreateDiscountCommand, Discount>();
            CreateMap<Discount, DiscountDto>()
                .ForMember(dest => dest.RestaurantName, opt => opt.MapFrom(src => src.Restaurant != null ? src.Restaurant.RestaurantName : "Hệ thống"))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<BuyXGetYPromotion, BuyXGetYPromotionDto>()
                .ForMember(dest => dest.TriggerProductName, opt => opt.MapFrom(src => src.TriggerProduct != null ? src.TriggerProduct.ItemName : string.Empty))
                .ForMember(dest => dest.GiftProductName, opt => opt.MapFrom(src => src.GiftProduct != null ? src.GiftProduct.ItemName : string.Empty));

            CreateMap<LoyaltyPoint, LoyaltyPointDto>()
                .ForMember(dest => dest.Tier, opt => opt.MapFrom(src => src.Tier.ToString()))
                .ForMember(dest => dest.History, opt => opt.Ignore());

            CreateMap<LoyaltyPointHistory, LoyaltyPointHistoryDto>()
                .ForMember(dest => dest.TransactionType, opt => opt.MapFrom(src => src.TransactionType.ToString()));
        }
    }
}

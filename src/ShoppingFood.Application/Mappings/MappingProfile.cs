using System.Linq;
using AutoMapper;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Dto.Product;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Features.Products.Commands;
using ShoppingFood.Application.Features.Products.Menu.Commands;

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
                .ReverseMap();

            CreateMap<AddUserCommand, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

            // Product mappings
            CreateMap<AddProductCommand, Product>()
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.ProductToppings, opt => opt.MapFrom(src => src.Toppings))
                .ForMember(dest => dest.ProductSizes, opt => opt.MapFrom(src => src.Sizes));

            CreateMap<UpdateProductCommand, Product>()
                .ForMember(dest => dest.Images, opt => opt.Ignore())
                .ForMember(dest => dest.ProductToppings, opt => opt.MapFrom(src => src.Toppings))
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

            CreateMap<ProductTopping, ProductToppingDto>().ReverseMap();
            CreateMap<ProductSize, ProductSizeDto>().ReverseMap();

            // MenuCategory mappings
            CreateMap<AddMenuCategoryCommand, MenuCategory>();
            
            CreateMap<UpdateMenuCategoryCommand, MenuCategory>();
            
            CreateMap<MenuCategory, MenuCategoryDto>()
                .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count : 0));
        }
    }
}

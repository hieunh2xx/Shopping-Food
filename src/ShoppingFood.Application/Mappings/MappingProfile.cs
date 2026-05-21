using System.Linq;
using AutoMapper;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Dto.Product;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Features.Products.Commands;

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
                .ForMember(dest => dest.Images, opt => opt.Ignore());

            CreateMap<UpdateProductCommand, Product>()
                .ForMember(dest => dest.Images, opt => opt.Ignore());

            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.RestaurantName, opt => opt.MapFrom(src => src.Restaurant != null ? src.Restaurant.RestaurantName : string.Empty))
                .ForMember(dest => dest.PrimaryImageUrl, opt => opt.MapFrom(src => src.Images != null && src.Images.Any() ? src.Images.First().ImageUrl : null))
                .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images != null ? src.Images.Select(i => i.ImageUrl).ToList() : new System.Collections.Generic.List<string>()));
        }
    }
}

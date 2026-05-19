using AutoMapper;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.User;
using ShoppingFood.Application.Features.Users.Commands;

namespace ShoppingFood.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.FullName : string.Empty))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.Role.ToString() : string.Empty))
                .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.AvatarUrl : null))
                .ReverseMap();

            CreateMap<AddUserCommand, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
        }
    }
}

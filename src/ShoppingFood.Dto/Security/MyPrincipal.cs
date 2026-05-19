using System.Security.Claims;
using ShoppingFood.Dto.User;

namespace ShoppingFood.Dto.Security
{
    public class MyPrincipal : ClaimsPrincipal
    {
        public UserDto UserDto { get; private set; }

        public MyPrincipal(UserDto userDto)
        {
            UserDto = userDto;
            
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userDto.Id.ToString()),
                new Claim(ClaimTypes.Name, userDto.UserName),
                new Claim(ClaimTypes.Role, userDto.Role)
            };
            var identity = new ClaimsIdentity(claims, "CustomJwt");
            AddIdentity(identity);
        }
    }
}

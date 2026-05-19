using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ShoppingFood.Core.Security
{
    public static class TokenHelper
    {
        public static string GetUsernameFromToken(string token, IConfiguration configuration)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;
            
            if (jwtToken == null)
                throw new SecurityTokenException("Invalid token format");

            // Extract username/subject claim
            var usernameClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Sub)
                ?? jwtToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)
                ?? jwtToken.Claims.FirstOrDefault(x => x.Type == "username")
                ?? jwtToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Name);

            if (usernameClaim == null)
                throw new SecurityTokenException("Username claim not found in token");

            return usernameClaim.Value;
        }

        public static string GenerateToken(string username, string secretKey, string issuer, string audience, int expiryMinutes = 60)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(secretKey);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] 
                { 
                    new Claim(JwtRegisteredClaimNames.Sub, username),
                    new Claim(ClaimTypes.Name, username)
                }),
                Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}

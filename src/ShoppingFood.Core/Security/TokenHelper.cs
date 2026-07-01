using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ShoppingFood.Core.Security
{
    public static class TokenHelper
    {
        public static string GetUsernameFromToken(string token, IConfiguration configuration)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new SecurityTokenException("Invalid token format");

            token = token.Trim();
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring("Bearer ".Length).Trim();
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            if (!tokenHandler.CanReadToken(token))
                throw new SecurityTokenException("Invalid token format");

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

        public static string GenerateToken(string username, string secretKey, string issuer, string audience, int expiryMinutes = 15)
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

        public static string GeneratePreAuthToken(string username, string secretKey, string issuer, string audience)
        {
            return GenerateToken(username, secretKey, issuer, audience, 10); // 10 minutes for PreAuth token
        }

        public static string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}

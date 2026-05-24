using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Features.Users.Queries;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.API.Controllers
{
    public class UserController : CommonController
    {
        private readonly IConfiguration _configuration;
        private readonly ShoppingFoodContext _dbContext;

        public UserController(IMediator mediator, IConfiguration configuration, ShoppingFoodContext dbContext) 
            : base(mediator)
        {
            _configuration = configuration;
            _dbContext = dbContext;
        }

        [HttpPost("Register")]
        public async Task<ActionResult<ApiResponse>> Register([FromBody] AddUserCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPost("RegisterSeller")]
        public async Task<ActionResult<ApiResponse>> RegisterSeller([FromBody] AddSellerCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get([FromQuery] GetUserQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost("Login")]
        public async Task<ActionResult<ApiResponse>> Login([FromBody] LoginRequest request)
        {
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.UserName == request.UserName);

            if (user == null)
            {
                return Unauthorized(ApiResponse.Failure(401, "Invalid username or password"));
            }

            var passwordHash = HashPassword(request.Password);
            if (user.PasswordHash != passwordHash)
            {
                return Unauthorized(ApiResponse.Failure(401, "Invalid username or password"));
            }

            // Get JWT configurations
            var secretKey = _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890";
            var issuer = _configuration["JwtSettings:Issuer"] ?? "ShoppingFoodAPI";
            var audience = _configuration["JwtSettings:Audience"] ?? "ShoppingFoodClient";

            var token = TokenHelper.GenerateToken(user.UserName!, secretKey, issuer, audience);

            return Ok(ApiResponse.Success(new
            {
                Token = token,
                Username = user.UserName,
                Role = user.Profile?.Role.ToString()
            }, "Login successful"));
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }

    public class LoginRequest
    {
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}

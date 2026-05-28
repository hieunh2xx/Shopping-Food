using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Features.Users.Queries;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using ShoppingFood.Dto.User;

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

        [HttpPost("UpgradeToMall")]
        public async Task<ActionResult<ApiResponse>> UpgradeToMall([FromBody] UpgradeToMallCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("Profile")]
        public async Task<IActionResult> GetProfile()
        {
            var username = userDto?.UserName;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized();
            }

            var query = new GetUserProfileQuery { Username = username };
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get([FromQuery] GetUserQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost("Login")]
        public async Task<ActionResult<ApiResponse>> Login([FromBody] Login request)
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
            var refreshToken = TokenHelper.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _dbContext.SaveChangesAsync();

            return Ok(ApiResponse.Success(new
            {
                Token = token,
                RefreshToken = refreshToken,
                Username = user.UserName,
                FullName = user.Profile?.FullName,
                Role = user.Profile?.Role.ToString(),
                AvatarUrl = user.Profile?.AvatarUrl
            }, "Login successful"));
        }

        [HttpPost("LoginGoogle")]
        public async Task<ActionResult<ApiResponse>> LoginGoogle([FromBody] LoginGoogleCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPost("LoginMicrosoft")]
        public async Task<ActionResult<ApiResponse>> LoginMicrosoft([FromBody] LoginMicrosoftCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPost("RefreshToken")]
        public async Task<ActionResult<ApiResponse>> RefreshToken([FromBody] RefreshTokenCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        [HttpGet("SellerApplication/Status")]
        public async Task<ActionResult<ApiResponse>> GetSellerApplicationStatus([FromQuery] GetSellerApplicationStatusQuery query)
        {
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPut("SellerApplication")]
        public async Task<ActionResult<ApiResponse>> UpdateSellerApplication([FromBody] UpdateSellerApplicationCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }

   
}

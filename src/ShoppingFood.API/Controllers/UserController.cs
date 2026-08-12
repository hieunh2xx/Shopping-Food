using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

        [HttpPost("register-shipper")]
        public async Task<ActionResult<ApiResponse>> RegisterShipper([FromBody] RegisterShipperCommand command)
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
                .FirstOrDefaultAsync(u => u.UserName == request.UserName || u.Email == request.UserName);

            if (user == null)
            {
                return Unauthorized(ApiResponse.Failure(401, "Sai Tên đăng nhập / Email hoặc Mật khẩu."));
            }

            var passwordHash = HashPassword(request.Password);
            if (user.PasswordHash != passwordHash)
            {
                return Unauthorized(ApiResponse.Failure(401, "Sai Tên đăng nhập / Email hoặc Mật khẩu."));
            }

            if (user.Status == ShoppingFood.Domain.Enums.UserStatus.Blocked)
            {
                return Unauthorized(ApiResponse.Failure(403, "Tài khoản của bạn đã bị khóa bởi quản trị viên."));
            }

            if (user.Status == ShoppingFood.Domain.Enums.UserStatus.Inactive)
            {
                // Generate PreAuth Token (valid for 5 mins) for unlocking
                var unlockPreAuthToken = ShoppingFood.Core.Security.TokenHelper.GeneratePreAuthToken(user.UserName!, _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890", _configuration["JwtSettings:Issuer"] ?? "ShoppingFoodAPI", _configuration["JwtSettings:Audience"] ?? "ShoppingFoodClient");

                var methods = new System.Collections.Generic.List<string>();
                if (!string.IsNullOrEmpty(user.Email)) methods.Add("email");
                if (!string.IsNullOrEmpty(user.Phone)) methods.Add("phone");

                return Ok(ApiResponse.Success(new { PreAuthToken = unlockPreAuthToken, AvailableMethods = methods }, "AccountLocked"));
            }

            // Cancel deletion if requested
            if (user.DeleteRequestedAt.HasValue)
            {
                user.DeleteRequestedAt = null;
                await _dbContext.SaveChangesAsync();
            }

            // Get JWT configurations
            var secretKey = _configuration["JwtSettings:Secret"] ?? "SuperSecretShoppingFoodKey1234567890";
            var issuer = _configuration["JwtSettings:Issuer"] ?? "ShoppingFoodAPI";
            var audience = _configuration["JwtSettings:Audience"] ?? "ShoppingFoodClient";

            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var isAdmin = user.Profile?.Role == ShoppingFood.Domain.Enums.UserRole.Admin;

            var isTrusted = await _dbContext.TrustedDevices.AnyAsync(t =>
                t.UserAccountId == user.Id &&
                t.IpAddress == clientIp &&
                t.ExpiresAt > DateTime.UtcNow);

            if (isTrusted || isAdmin)
            {
                var token = TokenHelper.GenerateToken(user.UserName!, secretKey, issuer, audience);
                var refreshToken = TokenHelper.GenerateRefreshToken();

                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
                await _dbContext.SaveChangesAsync();

                var loginResponse = new LoginResponseDto
                {
                    Token = token,
                    Username = user.UserName,
                    FullName = user.Profile?.FullName,
                    Role = user.Profile?.Role.ToString(),
                    AvatarUrl = user.Profile?.AvatarUrl
                };

                AppendRefreshTokenCookie(refreshToken);

                return Ok(ApiResponse.Success(loginResponse, "Login successful"));
            }

            // Generate PreAuth Token (valid for 5 mins)
            var preAuthToken = TokenHelper.GeneratePreAuthToken(user.UserName!, secretKey, issuer, audience);

            var availableMethods = new System.Collections.Generic.List<string>();
            if (!string.IsNullOrEmpty(user.Email)) availableMethods.Add("email");
            if (!string.IsNullOrEmpty(user.Phone)) availableMethods.Add("phone");

            var responseDto = new PreAuthResponseDto
            {
                PreAuthToken = preAuthToken,
                AvailableMethods = availableMethods,
                Username = user.UserName!
            };

            return Ok(ApiResponse.Success(responseDto, "RequireOtp"));
        }

        [HttpPost("SendLoginOtp")]
        public async Task<ActionResult<ApiResponse>> SendLoginOtp([FromBody] SendLoginOtpRequest request)
        {
            var command = new SendLoginOtpCommand
            {
                PreAuthToken = request.PreAuthToken,
                Method = request.Method,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("VerifyLoginOtp")]
        public async Task<ActionResult<ApiResponse>> VerifyLoginOtp([FromBody] VerifyLoginOtpRequest request)
        {
            var command = new VerifyLoginOtpCommand
            {
                PreAuthToken = request.PreAuthToken,
                OtpCode = request.OtpCode,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);

            if (response.Data is LoginResponseDto loginResponse)
            {
                AppendRefreshTokenCookie(loginResponse.RefreshToken);
                loginResponse.RefreshToken = "";
            }
            return Ok(response);
        }

        [HttpPost("LoginGoogle")]
        public async Task<ActionResult<ApiResponse>> LoginGoogle([FromBody] LoginGoogleCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            if (response.Data is LoginResponseDto loginResponse)
            {
                AppendRefreshTokenCookie(loginResponse.RefreshToken);
                loginResponse.RefreshToken = "";
            }
            return Ok(response);
        }

        [HttpPost("SendOtp")]
        public async Task<ActionResult<ApiResponse>> SendOtp([FromBody] SendOtpRequest request)
        {
            var command = new SendOtpCommand
            {
                Phone = request.Phone,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("LoginByPhone")]
        public async Task<ActionResult<ApiResponse>> LoginByPhone([FromBody] LoginByPhoneRequest request)
        {
            var command = new LoginByPhoneCommand
            {
                Phone = request.Phone,
                OtpCode = request.OtpCode
            };
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);

            if (response.Data is LoginResponseDto loginResponse)
            {
                AppendRefreshTokenCookie(loginResponse.RefreshToken);
                loginResponse.RefreshToken = "";
            }
            return Ok(response);
        }

        [HttpPost("LoginFirebasePhone")]
        public async Task<ActionResult<ApiResponse>> LoginFirebasePhone([FromBody] LoginFirebasePhoneCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);

            if (response.Data is LoginResponseDto loginResponse)
            {
                AppendRefreshTokenCookie(loginResponse.RefreshToken);
                loginResponse.RefreshToken = "";
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
            if (response.Data is LoginResponseDto loginResponse)
            {
                AppendRefreshTokenCookie(loginResponse.RefreshToken);
                loginResponse.RefreshToken = "";
            }
            return Ok(response);
        }

        [HttpPost("RefreshToken")]
        public async Task<ActionResult<ApiResponse>> RefreshToken([FromBody] RefreshTokenCommand command)
        {
            // Extract from cookie if missing from body
            if (string.IsNullOrEmpty(command.RefreshToken) && Request.Cookies.TryGetValue("refreshToken", out var cookieToken))
            {
                command.RefreshToken = cookieToken;
            }

            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            if (response.Data is LoginResponseDto loginResponse)
            {
                AppendRefreshTokenCookie(loginResponse.RefreshToken);
                loginResponse.RefreshToken = "";
            }
            return Ok(response);
        }

        [HttpPost("Logout")]
        public IActionResult Logout()
        {
            ClearRefreshTokenCookie();
            return Ok(ApiResponse.Success(null, "Logged out successfully"));
        }

        [HttpPost("ForgotPassword")]
        public async Task<ActionResult<ApiResponse>> ForgotPassword([FromBody] ForgotPasswordCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("VerifyResetOtp")]
        public async Task<ActionResult<ApiResponse>> VerifyResetOtp([FromBody] VerifyResetOtpCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("ResetPassword")]
        public async Task<ActionResult<ApiResponse>> ResetPassword([FromBody] ResetPasswordCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("ChangePassword")]
        public async Task<ActionResult<ApiResponse>> ChangePassword([FromBody] ChangePasswordCommand command)
        {
            if (userDto == null)
            {
                return Unauthorized(ApiResponse.Failure(401, "Vui lòng đăng nhập để thực hiện chức năng này."));
            }
            command.CurrentUserId = userDto.Id;
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("UploadAvatar")]
        public async Task<ActionResult<ApiResponse>> UploadAvatar([FromForm] UploadAvatarCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPost("UploadImage")]
        public async Task<ActionResult<ApiResponse>> UploadImage([FromForm] UploadImageCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut("UpdateProfile")]
        public async Task<ActionResult<ApiResponse>> UpdateProfile([FromBody] UpdateProfileCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("RequestUpdateContact")]
        public async Task<ActionResult<ApiResponse>> RequestUpdateContact([FromBody] RequestUpdateContactCommand command)
        {
            command.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("VerifyUpdateContact")]
        public async Task<ActionResult<ApiResponse>> VerifyUpdateContact([FromBody] VerifyUpdateContactCommand command)
        {
            command.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var response = await _mediator.Send(command);
            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        private void AppendRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                Secure = true, // Must be true when SameSite=None
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.None
            };
            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }

        private void ClearRefreshTokenCookie()
        {
            var cookieOptions = new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(-1),
                Secure = true,
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.None
            };
            Response.Cookies.Append("refreshToken", "", cookieOptions);
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

        [HttpPost("ApplySeller")]
        public async Task<ActionResult<ApiResponse>> ApplySeller([FromBody] ApplySellerCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Error)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut("SellerApplication")]
        public async Task<ActionResult<ApiResponse>> UpdateSellerApplication([FromBody] UpdateSellerApplicationCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPost("apply-shipper")]
        public async Task<ActionResult<ApiResponse>> ApplyShipper([FromBody] ApplyShipperCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            

            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("my-applications")]
        public async Task<ActionResult<ApiResponse>> GetMyApplications()
        {
            var query = new GetMyApplicationsQuery { CurrentUserId = userDto!.Id };
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPut("update-shipper-application")]
        public async Task<ActionResult<ApiResponse>> UpdateShipperApplication([FromBody] UpdateShipperApplicationCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpPost("LockAccount")]
        public async Task<ActionResult<ApiResponse>> LockAccount()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.Status = ShoppingFood.Domain.Enums.UserStatus.Inactive;

            // Clear refresh token to force logout
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;

            await _dbContext.SaveChangesAsync();

            var cookieOptions = new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(-1),
                Secure = true,
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.None
            };
            Response.Cookies.Append("refreshToken", "", cookieOptions);

            return Ok(ApiResponse.Success(null, "Đã khóa tài khoản bảo vệ thành công."));
        }

        [HttpPost("VerifyUnlockAccount")]
        public async Task<ActionResult<ApiResponse>> VerifyUnlockAccount([FromBody] VerifyLoginOtpRequest request)
        {
            var command = new ShoppingFood.Application.Features.Users.Commands.VerifyLoginOtpCommand
            {
                PreAuthToken = request.PreAuthToken,
                OtpCode = request.OtpCode,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            var response = await _mediator.Send(command);

            // If OTP is valid, unlock the account
            if (!response.Error)
            {
                // We need to extract the username from PreAuthToken
                var username = ShoppingFood.Core.Security.TokenHelper.GetUsernameFromToken(request.PreAuthToken, _configuration);
                if (!string.IsNullOrEmpty(username))
                {
                    var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserName == username);
                    if (user != null && user.Status == ShoppingFood.Domain.Enums.UserStatus.Inactive)
                    {
                        user.Status = ShoppingFood.Domain.Enums.UserStatus.Active;
                        await _dbContext.SaveChangesAsync();
                    }
                }

                if (response.Data is ShoppingFood.Dto.User.LoginResponseDto loginResponse)
                {
                    AppendRefreshTokenCookie(loginResponse.RefreshToken);
                    loginResponse.RefreshToken = "";
                }
            }

            if (response.Error) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("RequestDeletion")]
        [Authorize]
        public async Task<ActionResult<ApiResponse>> RequestDeletion()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.DeleteRequestedAt = DateTime.UtcNow;

            // Clear refresh token to force logout
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;

            await _dbContext.SaveChangesAsync();

            var cookieOptions = new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(-1),
                Secure = true,
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.None
            };
            Response.Cookies.Append("refreshToken", "", cookieOptions);

            return Ok(ApiResponse.Success(null, "Đã gửi yêu cầu xóa tài khoản. Dữ liệu sẽ bị xóa sau 30 ngày."));
        }

        
    }
}

using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Security;
using ShoppingFood.Dto.User;

namespace ShoppingFood.API.Filters
{
    public class AuthenticationFilter : IAsyncActionFilter
    {
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ShoppingFoodContext _dbContext;
        private readonly IMapper _mapper;

        public AuthenticationFilter(IConfiguration configuration, IUnitOfWork unitOfWork, ShoppingFoodContext dbContext, IMapper mapper)
        {
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var path = context.HttpContext.Request.Path.Value ?? string.Empty;

            // Bypass authentication for public endpoints
            if (path == "/" || 
                path.Equals("/api/User/Login", StringComparison.OrdinalIgnoreCase) || 
                path.Equals("/api/User/Register", StringComparison.OrdinalIgnoreCase) || 
                path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
                (context.HttpContext.Request.Method == "GET" && path.StartsWith("/api/Product", StringComparison.OrdinalIgnoreCase)))
            {
                await next();
                return;
            }

            if (!context.HttpContext.Request.Headers.ContainsKey("Authorization"))
            {
                throw new UnauthorizedAccessException("Authorization Header Missing");
            }

            string token = context.HttpContext.Request.Headers["Authorization"]!;
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring("Bearer ".Length).Trim();
            }

            // Decode username
            string username = TokenHelper.GetUsernameFromToken(token, _configuration);

            // Fetch user
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserName == username);

            if (user == null)
            {
                throw new UnauthorizedAccessException($"User '{username}' not found");
            }

            var userDto = _mapper.Map<UserDto>(user);
            context.HttpContext.User = new MyPrincipal(userDto);

            // Inject CurrentUserId into Commands/Queries
            foreach (var arg in context.ActionArguments.Values)
            {
                if (arg is Core.Base.BaseCommand command)
                {
                    command.CurrentUserId = user.Id;
                }
                else if (arg is Core.Base.BaseQuery query)
                {
                    query.CurrentUserId = user.Id;
                }
            }

            // Serialize and log the audit action
            string requestData = string.Empty;
            if (context.ActionArguments != null && context.ActionArguments.Count > 0)
            {
                // Strip passwords or sensitive fields from log payload for security compliance
                var safeArgs = context.ActionArguments.ToDictionary(
                    k => k.Key,
                    v => v.Value is ShoppingFood.Application.Features.Users.Commands.AddUserCommand c ? new { c.UserName, c.FullName, c.Email, c.Phone, c.Role } : v.Value
                );
                requestData = JsonConvert.SerializeObject(safeArgs);
            }

            var actionLog = new ActionLog
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Action = $"{context.HttpContext.Connection.RemoteIpAddress}||{context.HttpContext.Request.Method}||{context.HttpContext.Request.Path}",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = user.Id,
                Message = requestData
            };

            await _unitOfWork.LogActionAsync(actionLog);

            await next();
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.Core.Middlewares
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IUnitOfWork unitOfWork)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex, unitOfWork);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception, IUnitOfWork unitOfWork)
        {
            context.Response.ContentType = "application/json";
            
            var code = (int)HttpStatusCode.InternalServerError;
            var message = "An error occurred while processing your request.";
            object? data = null;

            if (exception is ValidationException validationException)
            {
                code = (int)HttpStatusCode.BadRequest;
                message = "Validation failed.";
                data = validationException.Errors.Select(e => new { Property = e.PropertyName, Error = e.ErrorMessage }).ToList();
            }
            else if (exception is UnauthorizedAccessException)
            {
                code = (int)HttpStatusCode.Unauthorized;
                message = exception.Message;
            }
            else if (exception is KeyNotFoundException)
            {
                code = (int)HttpStatusCode.NotFound;
                message = exception.Message;
            }
            else
            {
                // Log the exception to the database via UnitOfWork
                await unitOfWork.LogErrorAsync($"Global Middleware Catch: {context.Request.Path}", exception);
                message = exception.Message;
            }

            context.Response.StatusCode = code;

            var response = new ApiResponse(true, code, message, data);
            
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(response, options);

            await context.Response.WriteAsync(json);
        }
    }
}

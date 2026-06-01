using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using ShoppingFood.Core.Behaviors;

namespace ShoppingFood.Application
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            var assembly = Assembly.GetExecutingAssembly();

            // Auto-register AutoMapper
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(ApplicationServiceRegistration).Assembly));

            // Auto-register Validators
            services.AddValidatorsFromAssembly(assembly);

            // Configure MediatR
            services.AddMediatR(cfg =>
            {
                cfg.RegisterServicesFromAssembly(assembly);
                
                // Add Pipeline Behaviors (Executed in FIFO order)
                cfg.AddOpenBehavior(typeof(UnhandledExceptionBehaviour<,>));
                cfg.AddOpenBehavior(typeof(ValidationBehaviour<,>));
            });

            services.AddHttpClient<ShoppingFood.Application.Interfaces.IStringeeService, ShoppingFood.Application.Services.StringeeService>();
            services.AddTransient<ShoppingFood.Application.Interfaces.IEmailService, ShoppingFood.Application.Services.EmailService>();
            services.AddTransient<ShoppingFood.Application.Interfaces.IPhotoService, ShoppingFood.Application.Services.PhotoService>();
            return services;
        }
    }
}

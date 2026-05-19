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
            services.AddAutoMapper(assembly);

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

            return services;
        }
    }
}

using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShoppingFood.Application.Options;
using ShoppingFood.Core.Behaviors;
using AutoMapper;
namespace ShoppingFood.Application
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
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
            services.AddScoped<ShoppingFood.Application.Interfaces.IPaymentSettlementService, ShoppingFood.Application.Services.PaymentSettlementService>();
            services.AddHttpClient<ShoppingFood.Application.Interfaces.ISepayBankAccountResolver, ShoppingFood.Application.Services.SepayBankAccountResolver>();
            services.AddSingleton<ShoppingFood.Application.Interfaces.ISepayService, ShoppingFood.Application.Services.SepayService>();
            services.AddMemoryCache();
            services.AddSingleton<ShoppingFood.Application.Interfaces.IPaymentMessageQueue, ShoppingFood.Application.Services.PaymentMessageQueue>();
            services.AddSingleton<ShoppingFood.Application.Interfaces.IPaymentCacheService, ShoppingFood.Application.Services.PaymentCacheService>();
            services.AddScoped<ShoppingFood.Application.Interfaces.IPaymentOrchestrationService, ShoppingFood.Application.Services.PaymentOrchestrationService>();
            services.Configure<SepayOptions>(configuration.GetSection(SepayOptions.SectionName));
            return services;
        }
    }
}

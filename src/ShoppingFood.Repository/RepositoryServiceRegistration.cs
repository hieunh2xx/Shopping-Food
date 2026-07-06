using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Repository.Implementations;

namespace ShoppingFood.Repository
{
    public static class RepositoryServiceRegistration
    {
        public static IServiceCollection AddRepositoryServices(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? "Server=(localdb)\\mssqllocaldb;Database=ShoppingFoodDb;Trusted_Connection=True;MultipleActiveResultSets=true";
            services.AddSingleton<Interceptors.NotificationPushInterceptor>();

            services.AddDbContext<ShoppingFoodContext>((sp, options) =>
            {
                var interceptor = sp.GetRequiredService<Interceptors.NotificationPushInterceptor>();
                options.UseSqlServer(connectionString)
                       .AddInterceptors(interceptor);
            });

            services.AddDbContext<LogContext>(options =>
                options.UseSqlServer(connectionString));

            // Generic repository DbContext injection
            services.AddScoped<DbContext, ShoppingFoodContext>(provider => provider.GetRequiredService<ShoppingFoodContext>());

            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Auto scan using Scrutor
            services.Scan(scan => scan
                .FromCallingAssembly()
                .AddClasses()
                .AsMatchingInterface()
                .WithScopedLifetime());

            return services;
        }
    }
}

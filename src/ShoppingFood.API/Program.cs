using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ShoppingFood.API.Filters;
using ShoppingFood.API.Hubs;
using ShoppingFood.API.Workers;
using ShoppingFood.Application;
using ShoppingFood.Core.Middlewares;
using ShoppingFood.Domain.Context;
using ShoppingFood.Repository;

var builder = WebApplication.CreateBuilder(args);

// Add API controllers and hook up the global Authentication & Action Audit filter
builder.Services.AddControllers(options =>
{
    options.Filters.Add<AuthenticationFilter>();
    options.Filters.Add<MaintenanceFilter>();
    options.Filters.Add<CheckSellerSuspensionAttribute>();
}).AddNewtonsoftJson(options => 
{
    options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
    options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
});

// Add clean architecture layer service registrations
builder.Services.AddRepositoryServices(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddScoped<ShoppingFood.Application.Interfaces.INotificationPushService, ShoppingFood.API.Services.NotificationPushService>();
builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();

builder.Services.AddHostedService<MemberTierEvaluationWorker>();
builder.Services.AddHostedService<PaymentProcessingWorker>();
builder.Services.AddHostedService<PaymentExpiryWorker>();

// Add API documentation via Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Shopping Food API", Version = "v1" });
    
    // Add Bearer Token security definition in Swagger UI
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


// Configure CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Initialize Firebase Admin SDK
try
{
    var firebaseKeyPath = builder.Configuration["FirebaseSettings:ServiceAccountKeyPath"];
    if (!string.IsNullOrEmpty(firebaseKeyPath) && System.IO.File.Exists(firebaseKeyPath))
    {
        FirebaseAdmin.FirebaseApp.Create(new FirebaseAdmin.AppOptions()
        {
            Credential = Google.Apis.Auth.OAuth2.GoogleCredential.FromFile(firebaseKeyPath)
        });
        Console.WriteLine("Firebase Admin SDK initialized successfully.");
    }
    else
    {
        Console.WriteLine($"Firebase Admin SDK skipped. Service Account Key not found at: {firebaseKeyPath}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to initialize Firebase Admin SDK: {ex.Message}");
}

var app = builder.Build();

// Auto-create local SQL Server database at first startup for effortless execution
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ShoppingFoodContext>();
        var logContext = services.GetRequiredService<LogContext>();
        
        // This will apply any pending migrations to the database
        context.Database.Migrate();
        logContext.Database.Migrate();
        
        Console.WriteLine("Database migrations applied successfully!");

        if (app.Environment.IsDevelopment())
        {
            await ShoppingFood.API.Data.E2eDataSeeder.SeedAsync(context);
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred while creating the database: {ex.Message}");
    }
}

// Global exception capturing middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure HTTP pipeline for Swagger UI
if (app.Environment.IsDevelopment() || true) // always enable for user demo/testing convenience
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Shopping Food API v1");
    });
}

//app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NovaMartPOS.Application.Interfaces;
using NovaMartPOS.Application.Services;
using NovaMartPOS.Domain.Entities;
using NovaMartPOS.Domain.Enums;
using NovaMartPOS.Infrastructure.Auth;
using NovaMartPOS.Infrastructure.Persistence;
using NovaMartPOS.Infrastructure.Repositories;
using NovaMartPOS.API.Hubs;

namespace NovaMartPOS.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSignalR();

            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Paste ONLY your raw token here — Swagger UI adds 'Bearer ' automatically"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseMySql(
                    connectionString,
                    ServerVersion.AutoDetect(connectionString)
                ));

            builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
            var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;

            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
            builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
            builder.Services.AddScoped<IAuthService, AuthService>();

            builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
            builder.Services.AddScoped<ICategoryService, CategoryService>();

            builder.Services.AddScoped<IBrandRepository, BrandRepository>();
            builder.Services.AddScoped<IBrandService, BrandService>();

            builder.Services.AddScoped<IProductRepository, ProductRepository>();
            builder.Services.AddScoped<IProductService, ProductService>();

            builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
            builder.Services.AddScoped<ICustomerService, CustomerService>();

            builder.Services.AddScoped<ISaleRepository, SaleRepository>();
            builder.Services.AddScoped<ISaleService, SaleService>();

            builder.Services.AddScoped<IPromotionRepository, PromotionRepository>();
            builder.Services.AddScoped<IPromotionService, PromotionService>();

            builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
            builder.Services.AddScoped<IInventoryService, InventoryService>();

            builder.Services.AddScoped<IReturnRepository, ReturnRepository>();
            builder.Services.AddScoped<IReturnService, ReturnService>();

            builder.Services.AddScoped<IReportRepository, ReportRepository>();
            builder.Services.AddScoped<IReportService, ReportService>();

            builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
            builder.Services.AddScoped<ISupplierService, SupplierService>();

            builder.Services.AddScoped<IPurchaseOrderRepository, PurchaseOrderRepository>();
            builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();

            builder.Services.AddScoped<INotificationService, SignalRNotificationService>();

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                // SignalR's browser WebSocket transport can't attach an Authorization header,
                // so the client sends the token as a query string param instead — pick it up here.
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddAuthorization();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowFrontend");

            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.MapHub<DashboardHub>("/hubs/dashboard");

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

                if (!db.Users.Any())
                {
                    db.Users.Add(new User
                    {
                        FullName = "System Administrator",
                        Username = "admin",
                        PasswordHash = hasher.Hash("Admin@123"),
                        Role = UserRole.Administrator,
                        IsActive = true
                    });
                    db.SaveChanges();
                }

                if (!db.Customers.Any())
                {
                    db.Customers.Add(new Customer
                    {
                        Name = "Walk-in Customer",
                        IsActive = true
                    });
                    db.SaveChanges();
                }
            }

            app.Run();
        }
    }
}
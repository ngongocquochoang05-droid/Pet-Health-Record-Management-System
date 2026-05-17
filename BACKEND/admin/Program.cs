using System.Text.Json;
using System.Text.Json.Serialization;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Repositories;
using MyPuppy.Admin.Services;

var builder = WebApplication.CreateBuilder(args);

// Cho phep override port qua env var ADMIN_PORT (giu tuong thich voi setup cu).
var adminPort = builder.Configuration["ADMIN_PORT"]
    ?? Environment.GetEnvironmentVariable("ADMIN_PORT");
if (!string.IsNullOrWhiteSpace(adminPort))
{
    builder.WebHost.UseUrls($"http://localhost:{adminPort}");
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // camelCase ra ngoai (id, fullName, ...) — frontend dang dung snake/camel mix nhung doc theo camel.
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    });

// CORS — cho phep frontend Live Server / domain Vercel (config trong appsettings).
const string CorsPolicyName = "AdminCors";
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://127.0.0.1:5500", "http://localhost:5500" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<AdminRepository>();
builder.Services.AddSingleton<SystemService>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<StaffService>();
builder.Services.AddSingleton<ReportService>();
builder.Services.AddHttpClient<ClerkClient>();

var app = builder.Build();

// Global exception handler tra ve dung JSON format ApiResponse.
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (ServiceException ex)
    {
        context.Response.StatusCode = ex.StatusCode;
        context.Response.ContentType = "application/json; charset=utf-8";
        var body = ApiResponse<object>.Fail(ex.Message, ex.Details);
        await context.Response.WriteAsync(JsonSerializer.Serialize(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Unhandled exception");
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json; charset=utf-8";
        var body = ApiResponse<object>.Fail("Internal server error.");
        await context.Response.WriteAsync(JsonSerializer.Serialize(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
});

app.UseCors(CorsPolicyName);
app.MapControllers();

// Log tin hieu giong server.js cu, de developer thay quen.
var addresses = app.Urls.Count > 0
    ? string.Join(", ", app.Urls)
    : $"http://localhost:{adminPort ?? "4000"}";
app.Logger.LogInformation("MyPuppy admin backend is running at {Urls}", addresses);
app.Logger.LogInformation("Health check: {Urls}/api/admin/health", addresses);

app.Run();

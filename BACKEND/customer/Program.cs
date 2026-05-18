using System.Text.Json;
using System.Text.Json.Serialization;
using MyPuppy.Customer.Models;
using MyPuppy.Customer.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    "appsettings.Local.json",
    optional: true,
    reloadOnChange: true);

var customerPort = builder.Configuration["CUSTOMER_PORT"]
    ?? Environment.GetEnvironmentVariable("CUSTOMER_PORT");
if (!string.IsNullOrWhiteSpace(customerPort))
{
    builder.WebHost.UseUrls($"http://localhost:{customerPort}");
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    });

const string CorsPolicyName = "CustomerCors";
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

builder.Services.AddSingleton<CustomerRepository>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (CustomerApiException ex)
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
        logger.LogError(ex, "Unhandled customer API exception");
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json; charset=utf-8";
        var body = ApiResponse<object>.Fail("Customer backend internal error.");
        await context.Response.WriteAsync(JsonSerializer.Serialize(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
});

app.UseCors(CorsPolicyName);
app.MapControllers();

var addresses = app.Urls.Count > 0
    ? string.Join(", ", app.Urls)
    : $"http://localhost:{customerPort ?? "4002"}";
app.Logger.LogInformation("MyPuppy customer backend is running at {Urls}", addresses);
app.Logger.LogInformation("Health check: {Urls}/api/customer/health", addresses);

app.Run();

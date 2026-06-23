using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using PetHealth_BE.src.Data;
using PetHealth_BE.src.Repositories;
using PetHealth_BE.src.Services;
using PetHealth_BE.src.Hubs;
using PetHealth_BE.src.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("src/appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile("src/appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Configuration
    .AddUserSecrets(typeof(Program).Assembly, optional: true)
    .AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("PetHealth"));
});

builder.Services.AddScoped<SqlConnectionFactory>();
builder.Services.AddScoped<NguoiDungRepository>();
builder.Services.AddScoped<TaiKhoanTokenRepository>();
builder.Services.AddScoped<ThuCungRepository>();
builder.Services.AddScoped<DichVuRepository>();
builder.Services.AddScoped<LichHenRepository>();
builder.Services.AddScoped<FeatureRepository>();
builder.Services.AddScoped<ClinicalRepository>();
builder.Services.AddScoped<NotificationRepository>();
builder.Services.AddScoped<PasswordHasherService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<BookingNotificationService>();
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddHttpClient<IEmailService, EmailService>();
builder.Services.AddHostedService<ReminderBackgroundService>();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("PetHealthCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Missing Jwt:Issuer");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Missing Jwt:Audience");

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddCookie("External", options =>
    {
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Lax;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrWhiteSpace(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/hubs/pethealth"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    })
    .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
    {
        options.ClientId = (builder.Configuration["Google:ClientId"] ?? string.Empty).Trim();
        options.ClientSecret = (builder.Configuration["Google:ClientSecret"] ?? string.Empty).Trim();
        options.SignInScheme = "External";
        options.CallbackPath = "/signin-google";
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.Events.OnRemoteFailure = context =>
        {
            var frontendBaseUrl = (builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var error = Uri.EscapeDataString(context.Failure?.Message ?? "google_auth_failed");
            context.Response.Redirect($"{frontendBaseUrl}/auth/google-callback?error={error}");
            context.HandleResponse();
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (builder.Configuration.GetValue<bool>("Database:EnsureDefaultAccounts"))
{
    await DatabaseInitializer.EnsureDefaultAccountsAsync(app.Services);
}

if (builder.Configuration.GetValue<bool>("Database:SeedDemoData"))
{
    await DatabaseInitializer.InitializeAsync(app.Services);
}

app.UseSwagger();
app.UseSwaggerUI();

var staticFilesRoot = Path.Combine(app.Environment.ContentRootPath, "src", "wwwroot");
Directory.CreateDirectory(Path.Combine(staticFilesRoot, "uploads"));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(staticFilesRoot),
    RequestPath = string.Empty
});

app.UseCors("PetHealthCors");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<RealtimeChangeMiddleware>();
app.MapControllers();
app.MapHub<PetHealthHub>("/hubs/pethealth");

app.Run();

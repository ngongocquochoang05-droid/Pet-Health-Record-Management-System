using Microsoft.AspNetCore.Mvc;
using MyPuppy.Customer.Models;
using MyPuppy.Customer.Repositories;

namespace MyPuppy.Customer.Controllers;

[ApiController]
[Route("api/customer")]
public class HealthController : ControllerBase
{
    private readonly CustomerRepository _repository;

    public HealthController(CustomerRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var databaseConnected = await _repository.CanConnectAsync();
        return Ok(ApiResponse<object>.Ok(new
        {
            service = "MyPuppy Customer API",
            status = "running",
            database = databaseConnected ? "connected" : "disconnected"
        }));
    }
}

using Microsoft.AspNetCore.Mvc;
using MyPuppy.Customer.Models;
using MyPuppy.Customer.Repositories;

namespace MyPuppy.Customer.Controllers;

[ApiController]
[Route("api/customer/services")]
public class ServicesController : ControllerBase
{
    private readonly CustomerRepository _repository;

    public ServicesController(CustomerRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var services = await _repository.GetServicesAsync();
        return Ok(ApiResponse<IEnumerable<CustomerServiceDto>>.Ok(services));
    }
}

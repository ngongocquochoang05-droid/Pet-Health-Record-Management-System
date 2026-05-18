using Microsoft.AspNetCore.Mvc;
using MyPuppy.Customer.Models;
using MyPuppy.Customer.Repositories;

namespace MyPuppy.Customer.Controllers;

[ApiController]
[Route("api/customer/profile")]
public class ProfileController : ControllerBase
{
    private readonly CustomerRepository _repository;

    public ProfileController(CustomerRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("{clerkUserId}")]
    public async Task<IActionResult> Get(string clerkUserId)
    {
        var profile = await _repository.GetProfileAsync(clerkUserId);
        return profile is null
            ? NotFound(ApiResponse<object>.Fail("Customer profile not found."))
            : Ok(ApiResponse<CustomerProfileDto>.Ok(profile));
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertCustomerProfileRequest request)
    {
        var profile = await _repository.UpsertProfileAsync(request);
        return Ok(ApiResponse<CustomerProfileDto?>.Ok(profile));
    }
}

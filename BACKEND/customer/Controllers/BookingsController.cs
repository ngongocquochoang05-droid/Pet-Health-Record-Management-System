using Microsoft.AspNetCore.Mvc;
using MyPuppy.Customer.Models;
using MyPuppy.Customer.Repositories;

namespace MyPuppy.Customer.Controllers;

[ApiController]
[Route("api/customer/bookings")]
public class BookingsController : ControllerBase
{
    private readonly CustomerRepository _repository;

    public BookingsController(CustomerRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? customerId)
    {
        var bookings = await _repository.GetBookingsAsync(customerId);
        return Ok(ApiResponse<IEnumerable<CustomerBookingDto>>.Ok(bookings));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
    {
        var booking = await _repository.CreateBookingAsync(request);
        return Created($"/api/customer/bookings/{booking.Id}", ApiResponse<CustomerBookingDto>.Ok(booking));
    }
}

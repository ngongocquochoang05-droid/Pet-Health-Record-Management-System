using Microsoft.AspNetCore.Mvc;
using MyPuppy.Customer.Models;
using MyPuppy.Customer.Repositories;

namespace MyPuppy.Customer.Controllers;

[ApiController]
[Route("api/customer/products")]
public class ProductsController : ControllerBase
{
    private readonly CustomerRepository _repository;

    public ProductsController(CustomerRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var products = await _repository.GetProductsAsync();
        return Ok(ApiResponse<IEnumerable<CustomerProductDto>>.Ok(products));
    }
}

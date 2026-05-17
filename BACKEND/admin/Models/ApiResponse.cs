namespace MyPuppy.Admin.Models;

public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public object? Details { get; init; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string message, object? details = null)
        => new() { Success = false, Message = message, Details = details };
}

public class ServiceException : Exception
{
    public int StatusCode { get; }
    public object? Details { get; }

    public ServiceException(int statusCode, string message, object? details = null)
        : base(message)
    {
        StatusCode = statusCode;
        Details = details;
    }
}

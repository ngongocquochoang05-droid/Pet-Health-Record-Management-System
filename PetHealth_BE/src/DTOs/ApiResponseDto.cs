namespace PetHealth_BE.src.DTOs;

public class ApiResponseDto<T>
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;

    public T? Data { get; init; }

    public static ApiResponseDto<T> Ok(T? data, string message = "Success")
        => new()
        {
            Success = true,
            Message = message,
            Data = data
        };

    public static ApiResponseDto<T> Fail(string message)
        => new()
        {
            Success = false,
            Message = message,
            Data = default
        };
}

using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PetHealth_BE.src.Data;

namespace PetHealth_BE.src.Repositories;

public class SqlConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(AppDbContext dbContext)
    {
        _connectionString = dbContext.Database.GetConnectionString()
            ?? throw new InvalidOperationException("Missing PetHealth connection string.");
    }

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}

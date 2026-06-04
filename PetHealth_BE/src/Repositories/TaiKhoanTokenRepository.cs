using Dapper;

namespace PetHealth_BE.src.Repositories;

public class TaiKhoanTokenRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public TaiKhoanTokenRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task CreateAsync(string maNguoiDung, string loaiToken, string tokenHash, DateTime expiresAt)
    {
        const string sql = """
            UPDATE TaiKhoanToken
            SET DaSuDung = 1
            WHERE MaNguoiDung = @MaNguoiDung
              AND LoaiToken = @LoaiToken
              AND DaSuDung = 0;

            INSERT INTO TaiKhoanToken (MaNguoiDung, LoaiToken, TokenHash, HanSuDung, DaSuDung, NgayTao)
            VALUES (@MaNguoiDung, @LoaiToken, @TokenHash, @HanSuDung, 0, SYSUTCDATETIME());
            """;

        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            MaNguoiDung = maNguoiDung,
            LoaiToken = loaiToken,
            TokenHash = tokenHash,
            HanSuDung = expiresAt
        });
    }

    public async Task<string?> ConsumeAsync(string loaiToken, string tokenHash)
    {
        const string sql = """
            DECLARE @MaNguoiDung nvarchar(50);

            SELECT TOP (1) @MaNguoiDung = MaNguoiDung
            FROM TaiKhoanToken
            WHERE LoaiToken = @LoaiToken
              AND TokenHash = @TokenHash
              AND DaSuDung = 0
              AND HanSuDung >= SYSUTCDATETIME()
            ORDER BY MaToken DESC;

            IF @MaNguoiDung IS NOT NULL
            BEGIN
                UPDATE TaiKhoanToken
                SET DaSuDung = 1
                WHERE LoaiToken = @LoaiToken
                  AND TokenHash = @TokenHash;
            END;

            SELECT @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<string?>(sql, new
        {
            LoaiToken = loaiToken,
            TokenHash = tokenHash
        });
    }
}

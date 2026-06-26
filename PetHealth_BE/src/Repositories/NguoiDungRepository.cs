using Dapper;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;

namespace PetHealth_BE.src.Repositories;

public class NguoiDungRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public NguoiDungRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<NguoiDung?> GetByEmailAsync(string email)
    {
        const string sql = """
            SELECT
                MaNguoiDung AS MaNguoiDung,
                HoVaTen,
                Email,
                SoDienThoai,
                GioiTinh,
                DiaChi,
                VaiTro,
                TrangThaiHoatDong,
                NgayTao,
                PasswordHash,
                AuthProvider,
                GoogleSubject,
                LastLoginAt,
                EmailDaXacMinh
            FROM NguoiDung
            WHERE Email = @Email;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<NguoiDung>(sql, new { Email = email });
    }

    public async Task<NguoiDung?> GetByIdAsync(string maNguoiDung)
    {
        const string sql = """
            SELECT
                MaNguoiDung AS MaNguoiDung,
                HoVaTen,
                Email,
                SoDienThoai,
                GioiTinh,
                DiaChi,
                VaiTro,
                TrangThaiHoatDong,
                NgayTao,
                PasswordHash,
                AuthProvider,
                GoogleSubject,
                LastLoginAt,
                EmailDaXacMinh
            FROM NguoiDung
            WHERE MaNguoiDung = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<NguoiDung>(sql, new { MaNguoiDung = maNguoiDung });
    }

    public async Task<NguoiDung?> GetByGoogleSubjectAsync(string googleSubject)
    {
        const string sql = """
            SELECT
                MaNguoiDung AS MaNguoiDung,
                HoVaTen,
                Email,
                SoDienThoai,
                GioiTinh,
                DiaChi,
                VaiTro,
                TrangThaiHoatDong,
                NgayTao,
                PasswordHash,
                AuthProvider,
                GoogleSubject,
                LastLoginAt,
                EmailDaXacMinh
            FROM NguoiDung
            WHERE GoogleSubject = @GoogleSubject;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<NguoiDung>(sql, new { GoogleSubject = googleSubject });
    }

    public async Task<IEnumerable<NguoiDungDto>> GetAllAsync(string? vaiTro = null)
    {
        var sql = """
            SELECT
                MaNguoiDung AS MaNguoiDung,
                HoVaTen,
                Email,
                SoDienThoai,
                GioiTinh,
                DiaChi,
                VaiTro,
                TrangThaiHoatDong
            FROM NguoiDung
            """;

        if (!string.IsNullOrWhiteSpace(vaiTro))
        {
            sql += " WHERE VaiTro = @VaiTro";
        }

        sql += " ORDER BY VaiTro, HoVaTen;";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<NguoiDungDto>(sql, new { VaiTro = vaiTro });
    }

    public async Task<string> CreateAsync(NguoiDung user)
    {
        const string sql = """
            INSERT INTO NguoiDung (
                MaNguoiDung,
                HoVaTen,
                Email,
                SoDienThoai,
                GioiTinh,
                DiaChi,
                VaiTro,
                TrangThaiHoatDong,
                NgayTao,
                PasswordHash,
                AuthProvider,
                GoogleSubject,
                LastLoginAt,
                EmailDaXacMinh
            )
            OUTPUT INSERTED.MaNguoiDung
            VALUES (
                @MaNguoiDung,
                @HoVaTen,
                @Email,
                @SoDienThoai,
                @GioiTinh,
                @DiaChi,
                @VaiTro,
                @TrangThaiHoatDong,
                @NgayTao,
                @PasswordHash,
                @AuthProvider,
                @GoogleSubject,
                @LastLoginAt,
                @EmailDaXacMinh
            );
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<string>(sql, user)
            ?? throw new InvalidOperationException("Không tạo được người dùng mới.");
    }

    public async Task UpdatePasswordHashAsync(string maNguoiDung, string passwordHash)
    {
        const string sql = """
            UPDATE NguoiDung
            SET PasswordHash = @PasswordHash,
                AuthProvider = CASE
                    WHEN AuthProvider = 'Google' THEN 'Local,Google'
                    WHEN AuthProvider IS NULL OR AuthProvider = '' THEN 'Local'
                    ELSE AuthProvider
                END,
                EmailDaXacMinh = 1
            WHERE MaNguoiDung = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql, new { MaNguoiDung = maNguoiDung, PasswordHash = passwordHash });
    }

    public async Task LinkGoogleAsync(string maNguoiDung, string googleSubject)
    {
        const string sql = """
            UPDATE NguoiDung
            SET GoogleSubject = @GoogleSubject,
                AuthProvider = CASE WHEN PasswordHash IS NULL THEN 'Google' ELSE 'Local,Google' END,
                EmailDaXacMinh = 1
            WHERE MaNguoiDung = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql, new { MaNguoiDung = maNguoiDung, GoogleSubject = googleSubject });
    }

    public async Task UpdateLastLoginAsync(string maNguoiDung)
    {
        const string sql = """
            UPDATE NguoiDung
            SET LastLoginAt = SYSUTCDATETIME(),
                LoginCount = ISNULL(LoginCount, 0) + 1
            WHERE MaNguoiDung = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql, new { MaNguoiDung = maNguoiDung });
    }

    public async Task MarkEmailVerifiedAsync(string maNguoiDung)
    {
        const string sql = """
            UPDATE NguoiDung
            SET EmailDaXacMinh = 1
            WHERE MaNguoiDung = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql, new { MaNguoiDung = maNguoiDung });
    }

    public async Task<bool> UpdateProfileAsync(string maNguoiDung, UpdateNguoiDungDto request)
    {
        const string sql = """
            UPDATE NguoiDung
            SET HoVaTen = @HoVaTen,
                SoDienThoai = @SoDienThoai,
                GioiTinh = @GioiTinh,
                DiaChi = @DiaChi
            WHERE MaNguoiDung = @MaNguoiDung;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaNguoiDung = maNguoiDung,
            HoVaTen = request.HoVaTen.Trim(),
            SoDienThoai = string.IsNullOrWhiteSpace(request.SoDienThoai) ? null : request.SoDienThoai.Trim(),
            GioiTinh = string.IsNullOrWhiteSpace(request.GioiTinh) ? null : request.GioiTinh.Trim(),
            DiaChi = string.IsNullOrWhiteSpace(request.DiaChi) ? null : request.DiaChi.Trim()
        });

        return affected > 0;
    }

    public async Task<bool> UpdateRoleAsync(string maNguoiDung, UpdateUserRoleDto request)
    {
        const string sql = """
            UPDATE NguoiDung
            SET VaiTro = @VaiTro,
                TrangThaiHoatDong = @TrangThaiHoatDong
            WHERE MaNguoiDung = @MaNguoiDung;

            IF @@ROWCOUNT = 0
                RETURN;

            IF @VaiTro = 'Staff'
            BEGIN
                IF EXISTS (SELECT 1 FROM HoSoNhanVien WHERE MaNhanVien = @MaNguoiDung)
                BEGIN
                    UPDATE HoSoNhanVien
                    SET SanSangLamViec = @TrangThaiHoatDong
                    WHERE MaNhanVien = @MaNguoiDung;
                END
                ELSE
                BEGIN
                    INSERT INTO HoSoNhanVien (MaNhanVien, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
                    VALUES (@MaNguoiDung, N'Chưa cập nhật', 0, 0, @TrangThaiHoatDong);
                END
            END
            ELSE
            BEGIN
                UPDATE HoSoNhanVien
                SET SanSangLamViec = 0
                WHERE MaNhanVien = @MaNguoiDung;
            END
            """;

        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            MaNguoiDung = maNguoiDung,
            VaiTro = request.VaiTro.Trim(),
            request.TrangThaiHoatDong
        });

        return affected > 0;
    }

    public async Task EnsureMissingStaffProfilesAsync()
    {
        const string sql = """
            INSERT INTO HoSoNhanVien (MaNhanVien, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
            SELECT nd.MaNguoiDung, N'Chưa cập nhật', 0, 0, 1
            FROM NguoiDung nd
            WHERE nd.VaiTro = 'Staff'
              AND nd.TrangThaiHoatDong = 1
              AND NOT EXISTS
              (
                  SELECT 1
                  FROM HoSoNhanVien hs
                  WHERE hs.MaNhanVien = nd.MaNguoiDung
              );
            """;

        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(sql);
    }

    public async Task<string> CreateStaffAsync(StaffUpsertDto request, string passwordHash)
    {
        var maNhanVien = string.IsNullOrWhiteSpace(request.MaNhanVien)
            ? $"staff_{Guid.NewGuid():N}"
            : request.MaNhanVien.Trim();

        const string userSql = """
            INSERT INTO NguoiDung (MaNguoiDung, HoVaTen, Email, SoDienThoai, GioiTinh, DiaChi, VaiTro, TrangThaiHoatDong, NgayTao, PasswordHash, AuthProvider, EmailDaXacMinh)
            VALUES (@MaNhanVien, @HoVaTen, @Email, @SoDienThoai, '', '', 'Staff', 1, GETDATE(), @PasswordHash, 'Local', 1);
            """;

        const string profileSql = """
            INSERT INTO HoSoNhanVien (MaNhanVien, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
            VALUES (@MaNhanVien, @ChuyenMon, @NamKinhNghiem, @DiemDanhGia, @SanSangLamViec);
            """;

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        await connection.ExecuteAsync(userSql, new
        {
            MaNhanVien = maNhanVien,
            HoVaTen = request.HoVaTen.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            SoDienThoai = string.IsNullOrWhiteSpace(request.SoDienThoai) ? null : request.SoDienThoai.Trim(),
            PasswordHash = passwordHash
        }, transaction);
        await connection.ExecuteAsync(profileSql, new
        {
            MaNhanVien = maNhanVien,
            ChuyenMon = request.ChuyenMon.Trim(),
            request.NamKinhNghiem,
            request.DiemDanhGia,
            request.SanSangLamViec
        }, transaction);
        transaction.Commit();

        return maNhanVien;
    }

    public async Task<bool> UpdateStaffAsync(string maNhanVien, StaffUpsertDto request)
    {
        const string userSql = """
            UPDATE NguoiDung
            SET HoVaTen = @HoVaTen,
                Email = @Email,
                SoDienThoai = @SoDienThoai,
                VaiTro = 'Staff',
                TrangThaiHoatDong = 1
            WHERE MaNguoiDung = @MaNhanVien;
            """;

        const string profileSql = """
            IF EXISTS (SELECT 1 FROM HoSoNhanVien WHERE MaNhanVien = @MaNhanVien)
            BEGIN
                UPDATE HoSoNhanVien
                SET ChuyenMon = @ChuyenMon,
                    NamKinhNghiem = @NamKinhNghiem,
                    DiemDanhGia = @DiemDanhGia,
                    SanSangLamViec = @SanSangLamViec
                WHERE MaNhanVien = @MaNhanVien;
            END
            ELSE
            BEGIN
                INSERT INTO HoSoNhanVien (MaNhanVien, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
                VALUES (@MaNhanVien, @ChuyenMon, @NamKinhNghiem, @DiemDanhGia, @SanSangLamViec);
            END
            """;

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        var affected = await connection.ExecuteAsync(userSql, new
        {
            MaNhanVien = maNhanVien,
            HoVaTen = request.HoVaTen.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            SoDienThoai = string.IsNullOrWhiteSpace(request.SoDienThoai) ? null : request.SoDienThoai.Trim()
        }, transaction);
        await connection.ExecuteAsync(profileSql, new
        {
            MaNhanVien = maNhanVien,
            ChuyenMon = request.ChuyenMon.Trim(),
            request.NamKinhNghiem,
            request.DiemDanhGia,
            request.SanSangLamViec
        }, transaction);
        transaction.Commit();

        return affected > 0;
    }

    public async Task<bool> DeactivateStaffAsync(string maNhanVien)
    {
        const string sql = """
            UPDATE NguoiDung
            SET TrangThaiHoatDong = 0
            WHERE MaNguoiDung = @MaNhanVien
              AND VaiTro = 'Staff';

            UPDATE HoSoNhanVien
            SET SanSangLamViec = 0
            WHERE MaNhanVien = @MaNhanVien;
            """;

        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync(sql, new { MaNhanVien = maNhanVien }) > 0;
    }
}

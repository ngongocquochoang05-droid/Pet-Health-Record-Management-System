using Microsoft.EntityFrameworkCore;
using PetHealth_BE.src.Models;

namespace PetHealth_BE.src.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<NguoiDung> NguoiDungs => Set<NguoiDung>();

    public DbSet<ThuCung> ThuCungs => Set<ThuCung>();

    public DbSet<DichVu> DichVus => Set<DichVu>();

    public DbSet<LichHen> LichHens => Set<LichHen>();

    public DbSet<LichHenDichVu> LichHenDichVus => Set<LichHenDichVu>();

    public DbSet<HoSoNhanVien> HoSoNhanViens => Set<HoSoNhanVien>();

    public DbSet<CaLamViec> CaLamViecs => Set<CaLamViec>();

    public DbSet<TaiKhoanToken> TaiKhoanTokens => Set<TaiKhoanToken>();

    public DbSet<HoSoBenhAn> HoSoBenhAns => Set<HoSoBenhAn>();

    public DbSet<HoaDon> HoaDons => Set<HoaDon>();

    public DbSet<NhacLichTaiKham> NhacLichTaiKhams => Set<NhacLichTaiKham>();

    public DbSet<ThongBaoNguoiDung> ThongBaoNguoiDungs => Set<ThongBaoNguoiDung>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NguoiDung>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<ThuCung>(entity =>
        {
            entity.Property(x => x.NgaySinh).HasColumnType("date");
            entity.HasIndex(x => x.MaQr).IsUnique().HasFilter("[MaQr] IS NOT NULL");
            entity.HasOne(x => x.NguoiDung)
                .WithMany(x => x.ThuCungs)
                .HasForeignKey(x => x.MaNguoiDung)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LichHen>(entity =>
        {
            entity.ToTable(tb => tb.HasTrigger("TR_LichHen_ThongBao"));
            entity.Property(x => x.NgayHen).HasColumnType("date");
            entity.Property(x => x.GioHen).HasColumnType("time");
            entity.Property(x => x.GioKetThuc).HasColumnType("time");

            entity.HasOne(x => x.NguoiDung)
                .WithMany(x => x.LichHens)
                .HasForeignKey(x => x.MaNguoiDung)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ThuCung)
                .WithMany(x => x.LichHens)
                .HasForeignKey(x => x.MaThuCung)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.DichVu)
                .WithMany(x => x.LichHens)
                .HasForeignKey(x => x.MaDichVu)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LichHenDichVu>(entity =>
        {
            entity.HasKey(x => new { x.MaLichHen, x.MaDichVu });

            entity.HasOne(x => x.LichHen)
                .WithMany()
                .HasForeignKey(x => x.MaLichHen)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.DichVu)
                .WithMany()
                .HasForeignKey(x => x.MaDichVu)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HoSoNhanVien>(entity =>
        {
            entity.HasOne(x => x.NhanVien)
                .WithOne()
                .HasForeignKey<HoSoNhanVien>(x => x.MaNhanVien)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CaLamViec>(entity =>
        {
            entity.Property(x => x.NgayLam).HasColumnType("date");
            entity.Property(x => x.GioBatDau).HasColumnType("time");
            entity.Property(x => x.GioKetThuc).HasColumnType("time");
            entity.HasIndex(x => new { x.MaNhanVien, x.NgayLam });
            entity.HasOne(x => x.NhanVien)
                .WithMany()
                .HasForeignKey(x => x.MaNhanVien)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TaiKhoanToken>(entity =>
        {
            entity.HasIndex(x => new { x.LoaiToken, x.TokenHash, x.DaSuDung, x.HanSuDung })
                .HasDatabaseName("IX_TaiKhoanToken_Lookup");
            entity.HasOne(x => x.NguoiDung)
                .WithMany()
                .HasForeignKey(x => x.MaNguoiDung)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HoSoBenhAn>(entity =>
        {
            entity.HasIndex(x => x.MaLichHen).IsUnique();
            entity.HasOne(x => x.LichHen)
                .WithOne()
                .HasForeignKey<HoSoBenhAn>(x => x.MaLichHen)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.ThuCung)
                .WithMany()
                .HasForeignKey(x => x.MaThuCung)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.NhanVien)
                .WithMany()
                .HasForeignKey(x => x.MaNhanVien)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HoaDon>(entity =>
        {
            entity.HasIndex(x => x.MaLichHen).IsUnique();
        });

        modelBuilder.Entity<NhacLichTaiKham>(entity =>
        {
            entity.Property(x => x.NgayTaiKham).HasColumnType("date");
            entity.HasIndex(x => new { x.TrangThai, x.NgayTaiKham });
        });

        modelBuilder.Entity<ThongBaoNguoiDung>(entity =>
        {
            entity.HasIndex(x => new { x.MaNguoiDung, x.DaDoc, x.NgayTao })
                .HasDatabaseName("IX_ThongBaoNguoiDung_User");
        });
    }
}

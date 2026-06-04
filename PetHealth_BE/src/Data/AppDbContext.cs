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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NguoiDung>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<ThuCung>(entity =>
        {
            entity.Property(x => x.NgaySinh).HasColumnType("date");
            entity.HasOne(x => x.NguoiDung)
                .WithMany(x => x.ThuCungs)
                .HasForeignKey(x => x.MaNguoiDung)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LichHen>(entity =>
        {
            entity.Property(x => x.NgayHen).HasColumnType("date");
            entity.Property(x => x.GioHen).HasColumnType("time");

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
    }
}

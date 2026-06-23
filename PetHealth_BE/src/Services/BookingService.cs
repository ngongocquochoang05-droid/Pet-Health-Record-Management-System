using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Services;

public class BookingService
{
    private readonly LichHenRepository _bookingRepository;
    private readonly DichVuRepository _serviceRepository;
    private readonly ThuCungRepository _petRepository;
    private readonly NguoiDungRepository _userRepository;
    private readonly NotificationRepository _notificationRepository;

    public BookingService(
        LichHenRepository bookingRepository,
        DichVuRepository serviceRepository,
        ThuCungRepository petRepository,
        NguoiDungRepository userRepository,
        NotificationRepository notificationRepository)
    {
        _bookingRepository = bookingRepository;
        _serviceRepository = serviceRepository;
        _petRepository = petRepository;
        _userRepository = userRepository;
        _notificationRepository = notificationRepository;
    }

    public async Task<LichHenDto> CreateAsync(CreateLichHenDto request)
    {
        var user = await _userRepository.GetByIdAsync(request.MaNguoiDung)
            ?? throw new InvalidOperationException("Không tìm thấy người dùng đặt lịch.");

        var pet = await _petRepository.GetByIdAsync(request.MaThuCung)
            ?? throw new InvalidOperationException("Không tìm thấy thú cưng.");

        if (pet.MaNguoiDung != user.MaNguoiDung)
        {
            throw new InvalidOperationException("Thú cưng không thuộc người dùng này.");
        }

        var services = await GetServicesAsync(request.MaDichVus, request.MaDichVu);
        var primaryService = services[0];

        if (!DateTime.TryParse(request.NgayHen, out var ngayHen))
        {
            throw new InvalidOperationException("Ngày hẹn không hợp lệ.");
        }

        if (ngayHen.Date < DateTime.Today)
        {
            throw new InvalidOperationException("Không thể đặt lịch trong quá khứ.");
        }

        if (!TimeOnly.TryParse(request.GioHen, out var gioHen))
        {
            throw new InvalidOperationException("Giờ hẹn không hợp lệ.");
        }

        var openingTime = new TimeOnly(8, 0);
        var closingTime = new TimeOnly(17, 0);
        if (gioHen < openingTime || gioHen > closingTime)
        {
            throw new InvalidOperationException("Giờ hẹn phải nằm trong khung 08:00-17:00.");
        }

        if (await _bookingRepository.HasConflictAsync(pet.MaThuCung, ngayHen, gioHen.ToTimeSpan()))
        {
            throw new InvalidOperationException("Thú cưng đã có lịch hẹn trùng khung giờ này.");
        }

        var staff = await _bookingRepository.GetBestAvailableStaffAsync(ngayHen, gioHen.ToTimeSpan());

        var appointment = new LichHen
        {
            MaNguoiDung = user.MaNguoiDung,
            MaThuCung = pet.MaThuCung,
            MaDichVu = primaryService.MaDichVu,
            NgayHen = ngayHen,
            GioHen = gioHen,
            TrangThai = LichHenStatus.Pending,
            GhiChu = request.GhiChu,
            CreatedAt = DateTime.UtcNow
        };

        var id = await _bookingRepository.CreateAsync(appointment, services.Select(service => service.MaDichVu).ToList(), staff?.MaNhanVien);
        var created = new LichHenDto
        {
            MaLichHen = id,
            MaNguoiDung = user.MaNguoiDung,
            TenKhachHang = user.HoVaTen,
            MaThuCung = pet.MaThuCung,
            TenThuCung = pet.TenThuCung,
            MaDichVu = primaryService.MaDichVu,
            MaDichVuCsv = string.Join(',', services.Select(service => service.MaDichVu)),
            TenDichVu = string.Join(", ", services.Select(service => service.TenDichVu)),
            MaNhanVien = staff?.MaNhanVien,
            TenNhanVien = staff?.HoVaTen,
            NgayHen = request.NgayHen,
            GioHen = gioHen.ToString("HH:mm"),
            TrangThai = LichHenStatus.Pending,
            TongTien = services.Sum(service => service.GiaTien),
            GhiChu = request.GhiChu,
            CreatedAt = appointment.CreatedAt.ToString("O")
        };
        await _notificationRepository.NotifyBookingCreatedAsync(created);
        return created;
    }

    public async Task<LichHenDto> UpdateAsync(int maLichHen, string maNguoiDung, UpdateLichHenDto request)
    {
        var existing = await _bookingRepository.GetByIdAsync(maLichHen)
            ?? throw new InvalidOperationException("Không tìm thấy lịch hẹn.");

        if (existing.MaNguoiDung != maNguoiDung)
        {
            throw new InvalidOperationException("Bạn không có quyền cập nhật lịch hẹn này.");
        }

        if (existing.TrangThai is LichHenStatus.Completed or LichHenStatus.NoShow or LichHenStatus.Cancelled)
        {
            throw new InvalidOperationException("Chỉ có thể cập nhật lịch đang chờ xử lý hoặc đã xác nhận.");
        }

        var pet = await _petRepository.GetByIdAsync(request.MaThuCung)
            ?? throw new InvalidOperationException("Không tìm thấy thú cưng.");

        if (pet.MaNguoiDung != maNguoiDung)
        {
            throw new InvalidOperationException("Thú cưng không thuộc người dùng này.");
        }

        var services = await GetServicesAsync(request.MaDichVus, request.MaDichVu);

        if (!DateTime.TryParse(request.NgayHen, out var ngayHen) || ngayHen.Date < DateTime.Today)
        {
            throw new InvalidOperationException("Ngày hẹn không hợp lệ.");
        }

        if (!TimeOnly.TryParse(request.GioHen, out var gioHen))
        {
            throw new InvalidOperationException("Giờ hẹn không hợp lệ.");
        }

        var openingTime = new TimeOnly(8, 0);
        var closingTime = new TimeOnly(17, 0);
        if (gioHen < openingTime || gioHen > closingTime)
        {
            throw new InvalidOperationException("Giờ hẹn phải nằm trong khung 08:00-17:00.");
        }

        if (await _bookingRepository.HasConflictAsync(pet.MaThuCung, ngayHen, gioHen.ToTimeSpan(), maLichHen))
        {
            throw new InvalidOperationException("Thú cưng đã có lịch hẹn trùng khung giờ này.");
        }

        var staff = await _bookingRepository.GetBestAvailableStaffAsync(ngayHen, gioHen.ToTimeSpan());
        var updated = await _bookingRepository.UpdateAsync(
            maLichHen,
            maNguoiDung,
            request,
            services.Select(service => service.MaDichVu).ToList(),
            staff?.MaNhanVien);
        if (!updated)
        {
            throw new InvalidOperationException("Không cập nhật được lịch hẹn.");
        }

        return await _bookingRepository.GetByIdAsync(maLichHen)
            ?? throw new InvalidOperationException("Không tìm thấy lịch hẹn sau khi cập nhật.");
    }

    private async Task<List<DichVu>> GetServicesAsync(IEnumerable<int> requestedIds, int fallbackId)
    {
        var requestedServiceIds = requestedIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();
        var serviceIds = requestedServiceIds.Count > 0
            ? requestedServiceIds
            : [fallbackId];

        if (serviceIds.Count == 0)
        {
            throw new InvalidOperationException("Cần chọn ít nhất một dịch vụ.");
        }

        var services = new List<DichVu>();
        foreach (var serviceId in serviceIds)
        {
            var service = await _serviceRepository.GetByIdAsync(serviceId)
                ?? throw new InvalidOperationException($"Không tìm thấy dịch vụ {serviceId}.");

            if (!service.TrangThaiHoatDong)
            {
                throw new InvalidOperationException($"Dịch vụ {service.TenDichVu} đang tạm tắt.");
            }

            services.Add(service);
        }

        return services;
    }
}

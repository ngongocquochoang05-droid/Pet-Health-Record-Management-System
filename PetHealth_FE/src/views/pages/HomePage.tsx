import { Link } from 'react-router-dom';
import type { AuthResponseDto } from '../../models/auth';
import type { LichHenDto } from '../../models/booking';
import type { DichVuDto } from '../../models/service';
import type { ThuCungDto } from '../../models/pet';

interface HomePageProps {
  session: AuthResponseDto | null;
  services: DichVuDto[];
  pets: ThuCungDto[];
  bookings: LichHenDto[];
}

export function HomePage({ session, services, pets, bookings }: HomePageProps) {
  const nextBooking = bookings[0];
  const activeServices = services.filter((service) => service.trangThaiHoatDong);
  const featuredServices = [...activeServices].sort((left, right) => right.soLanDat - left.soLanDat).slice(0, 3);
  const quickService = activeServices[0] ?? services[0];
  const quickPet = pets[0];
  const quickDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const isAdmin = session?.user.vaiTro === 'Admin';
  const isStaff = session?.user.vaiTro === 'Staff';
  const primaryPath = isAdmin ? '/admin' : isStaff ? '/staff' : session ? '/booking' : '/auth';
  const primaryLabel = isAdmin ? 'Mở bảng quản trị' : isStaff ? 'Xem lịch phân công' : session ? 'Đặt lịch ngay' : 'Đăng nhập đặt lịch';
  const quickBookingPath = !session ? '/auth' : quickPet ? `/booking${quickService ? `?serviceId=${quickService.maDichVu}` : ''}` : '/pets';
  const quickBookingLabel = !session ? 'Đăng nhập để đặt lịch nhanh' : quickPet ? 'Đặt lịch nhanh' : 'Thêm hồ sơ thú cưng';

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-content">
          <p className="eyebrow">PetHealth Care</p>
          <h2>Chăm sóc thú cưng dễ dàng, an toàn và <span className="hero-accent">đúng lịch.</span></h2>
          <p className="hero-copy">
            Đặt lịch spa, grooming, khám sức khỏe và theo dõi hồ sơ thú cưng trong một hệ thống hiện đại,
            rõ ràng và thân thiện cho từng lần chăm sóc.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to={primaryPath}>{primaryLabel}</Link>
            <Link className="ghost-button" to="/services">Xem dịch vụ</Link>
          </div>

          <div className="quick-booking-card" aria-label="Đặt lịch nhanh">
            <div className="quick-booking-card__intro">
              <span>Đặt lịch nhanh</span>
              <strong>{quickBookingLabel}</strong>
            </div>
            <div className="quick-booking-fields">
              <div className="quick-field">
                <span>Dịch vụ</span>
                <strong>{quickService?.tenDichVu ?? 'Đang cập nhật'}</strong>
              </div>
              <div className="quick-field">
                <span>Thú cưng</span>
                <strong>{quickPet?.tenThuCung ?? 'Chưa có hồ sơ'}</strong>
              </div>
              <div className="quick-field">
                <span>Ngày gợi ý</span>
                <strong>{quickDate}</strong>
              </div>
              <Link className="quick-booking-button" to={quickBookingPath} aria-label={quickBookingLabel}>
                <span>Tiếp tục</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Tổng quan nhanh">
          <div className="hero-visual__top">
            <span>Bảng chăm sóc</span>
            <strong>{bookings.length}</strong>
          </div>
          <div className="hero-stats">
            <div className="metric-tile">
              <span>Dịch vụ đang mở</span>
              <strong>{activeServices.length}</strong>
            </div>
            <div className="metric-tile">
              <span>Thú cưng</span>
              <strong>{pets.length}</strong>
            </div>
            <div className="metric-tile">
              <span>Lịch hẹn</span>
              <strong>{bookings.length}</strong>
            </div>
          </div>
          <div className="hero-schedule-card">
            <span>{nextBooking ? 'Lịch gần nhất' : 'Sẵn sàng'}</span>
            <strong>{nextBooking ? nextBooking.tenDichVu : 'Chưa có lịch gần nhất'}</strong>
            <p>{nextBooking ? `${nextBooking.tenThuCung} - ${nextBooking.ngayHen} lúc ${nextBooking.gioHen}` : 'Bạn có thể tạo lịch mới bất cứ lúc nào.'}</p>
          </div>
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head">
          <div>
            <p className="eyebrow">Dịch vụ nổi bật</p>
            <h3>Những lựa chọn được đặt nhiều</h3>
          </div>
          <Link className="text-link" to="/services">Xem tất cả</Link>
        </div>

        <div className="featured-services">
          {featuredServices.map((service) => (
            <article className="featured-service-card" key={service.maDichVu}>
              <span className="status-badge">{service.trangThaiHoatDong ? 'Sẵn sàng' : 'Tạm tắt'}</span>
              <div>
                <strong>{service.tenDichVu}</strong>
                <p>{service.moTa}</p>
              </div>
              <div className="featured-service-card__foot">
                <span>{service.thoiGianThucHien} phút</span>
                <strong>{new Intl.NumberFormat('vi-VN').format(service.giaTien)} VND</strong>
              </div>
              <Link className="text-link" to={`/booking?serviceId=${service.maDichVu}`}>Đặt dịch vụ</Link>
            </article>
          ))}
          {featuredServices.length === 0 ? <p className="empty-state">Dịch vụ đang được cập nhật.</p> : null}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Hồ sơ khách hàng</p>
            <h3>Thông tin tài khoản</h3>
          </div>
          <Link className="text-link" to={session ? '/booking' : '/auth'}>
            {session ? 'Đặt lịch ngay' : 'Đăng nhập để bắt đầu'}
          </Link>
        </div>

        {session ? (
          <div className="detail-list">
            <div>
              <span>Khách hàng</span>
              <strong>{session.user.hoVaTen}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{session.user.email}</strong>
            </div>
            <div>
              <span>Số thú cưng</span>
              <strong>{pets.length} hồ sơ</strong>
            </div>
          </div>
        ) : (
          <p className="empty-state">Đăng nhập để lưu hồ sơ thú cưng, đặt lịch và theo dõi lịch chăm sóc của bạn.</p>
        )}
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Lịch hẹn tiếp theo</p>
            <h3>Lịch phòng khám sắp diễn ra</h3>
          </div>
          <Link className="text-link" to="/appointments">
            Xem tất cả
          </Link>
        </div>

        {nextBooking ? (
          <div className="appointment-highlight">
            <strong>{nextBooking.tenDichVu}</strong>
            <p>{nextBooking.tenThuCung}</p>
            <span>
              {nextBooking.ngayHen} lúc {nextBooking.gioHen}
            </span>
          </div>
        ) : (
          <p className="empty-state">Chưa có lịch hẹn nào. Bạn có thể đặt lịch mới ngay trong module đặt lịch.</p>
        )}
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Hồ sơ thú cưng</p>
            <h3>Đang theo dõi</h3>
          </div>
          <Link className="text-link" to={session ? '/pets' : '/auth'}>{pets.length ? 'Quản lý hồ sơ' : 'Thêm thú cưng'}</Link>
        </div>

        <div className="stack-list compact-list">
          {pets.slice(0, 3).map((pet) => (
            <article className="mini-pet-card" key={pet.maThuCung}>
              <div>
                <strong>{pet.tenThuCung}</strong>
                <p>{pet.loaiThuCung} - {pet.giong}</p>
              </div>
              <span>{pet.canNang ? `${pet.canNang} kg` : 'Chưa có cân nặng'}</span>
            </article>
          ))}
          {pets.length === 0 ? <p className="empty-state">Chưa có hồ sơ thú cưng. Tạo hồ sơ để đặt lịch nhanh hơn.</p> : null}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Ưu đãi & đặt cọc</p>
            <h3>Theo dõi quyền lợi của bạn</h3>
          </div>
          <Link className="text-link" to={session ? '/customer/rewards' : '/auth'}>Mở ưu đãi</Link>
        </div>

        <div className="appointment-highlight">
          <strong>Miễn phí 1 lần khám sau 3 lịch hoàn thành</strong>
          <p>Khách hàng có thể kiểm tra ưu đãi và lịch sử đặt cọc ngay trong tài khoản.</p>
          <span>Áp dụng theo dữ liệu lịch hẹn đã hoàn thành.</span>
        </div>
      </section>

    </div>
  );
}

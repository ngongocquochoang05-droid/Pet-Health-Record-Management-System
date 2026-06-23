import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api';
import { getAdminAppointments, getAdminUsers, getStaffAppointments } from '../api/managementApi';
import type { AuthResponseDto } from '../types/auth';
import type { LichHenDto } from '../types/booking';
import type { DichVuDto } from '../types/service';
import type { ThuCungDto } from '../types/pet';

interface HomePageProps {
  session: AuthResponseDto | null;
  services: DichVuDto[];
  pets: ThuCungDto[];
  bookings: LichHenDto[];
}

interface AdminStats {
  appointments: number;
  users: number;
}

export function HomePage({ session, services, pets, bookings }: HomePageProps) {
  const activeServices = services.filter((service) => service.trangThaiHoatDong);
  const isAdmin = session?.user.vaiTro === 'Admin';
  const isStaff = session?.user.vaiTro === 'Staff';
  const [adminStats, setAdminStats] = useState<AdminStats>({ appointments: 0, users: 0 });
  const [staffAppointments, setStaffAppointments] = useState<LichHenDto[]>([]);
  const [overviewMessage, setOverviewMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function loadRoleOverview() {
      setOverviewMessage('');

      try {
        if (isAdmin) {
          const [appointmentData, userData] = await Promise.all([getAdminAppointments(), getAdminUsers()]);
          if (!cancelled) {
            setAdminStats({ appointments: appointmentData.length, users: userData.length });
          }
          return;
        }

        if (isStaff && session) {
          const appointmentData = await getStaffAppointments(session.user.maNguoiDung);
          if (!cancelled) {
            setStaffAppointments(appointmentData);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setOverviewMessage(getApiErrorMessage(error));
        }
      }
    }

    void loadRoleOverview();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, isStaff, session]);

  if (isAdmin) {
    return (
      <AdminOverview
        activeServicesCount={activeServices.length}
        message={overviewMessage}
        stats={adminStats}
      />
    );
  }

  if (isStaff) {
    return (
      <StaffOverview
        activeServicesCount={activeServices.length}
        appointments={staffAppointments}
        message={overviewMessage}
      />
    );
  }

  return (
    <CustomerHome
      bookings={bookings}
      pets={pets}
      services={services}
      session={session}
      activeServices={activeServices}
    />
  );
}

function AdminOverview({
  activeServicesCount,
  message,
  stats
}: {
  activeServicesCount: number;
  message: string;
  stats: AdminStats;
}) {
  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-content">
          <p className="eyebrow">Quản trị hệ thống</p>
          <h2>Điều hành phòng khám, lịch hẹn và dữ liệu khách hàng.</h2>
          <p className="hero-copy">
            Trang tổng quan dành cho Admin dùng để nhìn nhanh tình hình hệ thống, sau đó đi vào quản lý lịch hẹn,
            phân quyền tài khoản, dịch vụ, ưu đãi, đặt cọc và vận hành phòng khám.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/admin">Mở bảng quản trị</Link>
            <Link className="ghost-button" to="/admin/system">Cấu hình hệ thống</Link>
          </div>
        </div>

        <div className="hero-visual" aria-label="Tổng quan quản trị">
          <div className="hero-visual__top">
            <span>Bảng quản trị</span>
            <strong>{stats.appointments}</strong>
          </div>
          <div className="hero-stats">
            <div className="metric-tile">
              <span>Lịch hẹn</span>
              <strong>{stats.appointments}</strong>
            </div>
            <div className="metric-tile">
              <span>Tài khoản</span>
              <strong>{stats.users}</strong>
            </div>
            <div className="metric-tile">
              <span>Dịch vụ mở</span>
              <strong>{activeServicesCount}</strong>
            </div>
          </div>
          <div className="hero-schedule-card">
            <span>Trọng tâm</span>
            <strong>Quản trị vận hành</strong>
            <p>Kiểm soát lịch hẹn, dịch vụ, tài khoản, ưu đãi, đặt cọc và báo cáo.</p>
          </div>
        </div>
      </section>

      {message ? <p className="form-message full-width">{message}</p> : null}

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Quản trị</p>
            <h3>Lịch hẹn và dịch vụ</h3>
          </div>
          <Link className="text-link" to="/admin">Mở</Link>
        </div>
        <div className="stack-list">
          <OverviewCard title="Quản lý lịch hẹn" description="Xem lịch, đổi trạng thái, phân công nhân viên và theo dõi đặt cọc." />
          <OverviewCard title="Quản lý dịch vụ" description="Thêm, sửa, xóa, bật tắt dịch vụ và cập nhật ảnh dịch vụ." />
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Hệ thống</p>
            <h3>Tài khoản và cấu hình</h3>
          </div>
          <Link className="text-link" to="/admin/system">Mở</Link>
        </div>
        <div className="stack-list">
          <OverviewCard title="Phân quyền tài khoản" description="Đổi vai trò Admin, Nhân viên, Khách hàng và khóa/mở tài khoản." />
          <OverviewCard title="Ưu đãi, QR và thanh toán" description="Cấp ưu đãi, cấp QR thú cưng, kiểm tra đặt cọc và cấu hình chức năng nâng cao." />
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head">
          <div>
            <p className="eyebrow">Vận hành</p>
            <h3>Các phần Admin cần theo dõi</h3>
          </div>
            <Link className="text-link" to="/admin/operations">Mở vận hành</Link>
        </div>
        <div className="featured-services">
          <OverviewCard title="Phân ca nhân viên" description="Sắp lịch làm việc cho nhân viên theo ngày." />
          <OverviewCard title="Báo cáo" description="Theo dõi doanh thu, khách hàng, dịch vụ nổi bật và xuất CSV." />
          <OverviewCard title="Thông báo" description="Xem thông báo hệ thống liên quan đến lịch hẹn và vận hành." />
        </div>
      </section>
    </div>
  );
}

function StaffOverview({
  activeServicesCount,
  appointments,
  message
}: {
  activeServicesCount: number;
  appointments: LichHenDto[];
  message: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((appointment) => appointment.ngayHen === today);
  const nextAppointment = appointments[0];

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-content">
          <p className="eyebrow">Nhân viên</p>
          <h2>Theo dõi ca làm, lịch được giao và hồ sơ chăm sóc.</h2>
          <p className="hero-copy">
            Trang tổng quan dành cho nhân viên tập trung vào lịch phân công, công việc trong ngày, tra cứu QR,
            cập nhật hồ sơ bệnh án và ảnh trước/sau dịch vụ.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/staff">Xem lịch phân công</Link>
            <Link className="ghost-button" to="/staff/work">Mở công việc</Link>
          </div>
        </div>

        <div className="hero-visual" aria-label="Tổng quan nhân viên">
          <div className="hero-visual__top">
            <span>Lịch được giao</span>
            <strong>{appointments.length}</strong>
          </div>
          <div className="hero-stats">
            <div className="metric-tile">
              <span>Hôm nay</span>
              <strong>{todayAppointments.length}</strong>
            </div>
            <div className="metric-tile">
              <span>Dịch vụ mở</span>
              <strong>{activeServicesCount}</strong>
            </div>
            <div className="metric-tile">
              <span>Công việc</span>
              <strong>{appointments.length}</strong>
            </div>
          </div>
          <div className="hero-schedule-card">
            <span>{nextAppointment ? 'Lịch gần nhất' : 'Sẵn sàng'}</span>
            <strong>{nextAppointment ? nextAppointment.tenDichVu : 'Chưa có lịch được giao'}</strong>
            <p>{nextAppointment ? `${nextAppointment.tenThuCung} - ${nextAppointment.ngayHen} lúc ${nextAppointment.gioHen}` : 'Bạn có thể theo dõi công việc khi được phân lịch.'}</p>
          </div>
        </div>
      </section>

      {message ? <p className="form-message full-width">{message}</p> : null}

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Lịch làm việc</p>
            <h3>Lịch phân công</h3>
          </div>
          <Link className="text-link" to="/staff">Mở</Link>
        </div>
        <div className="stack-list">
          <OverviewCard title="Xem lịch được giao" description="Kiểm tra danh sách lịch hẹn theo nhân viên đang đăng nhập." />
          <OverviewCard title="Cập nhật trạng thái" description="Chuyển trạng thái lịch hẹn theo luồng xử lý của nhân viên." />
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Công việc</p>
            <h3>Tra cứu và cập nhật</h3>
          </div>
          <Link className="text-link" to="/staff/work">Mở</Link>
        </div>
        <div className="stack-list">
          <OverviewCard title="Tra cứu QR thú cưng" description="Quét hoặc nhập mã QR để xem hồ sơ chăm sóc của thú cưng." />
          <OverviewCard title="Ảnh trước/sau dịch vụ" description="Tải ảnh dịch vụ để lưu lại quá trình chăm sóc." />
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head">
          <div>
            <p className="eyebrow">Khám và điều trị</p>
            <h3>Hồ sơ bệnh án</h3>
          </div>
          <Link className="text-link" to="/staff/medical-records">Mở hồ sơ</Link>
        </div>
        <div className="featured-services">
          <OverviewCard title="Tạo và cập nhật bệnh án" description="Ghi chẩn đoán, điều trị, thuốc, tiêm chủng và ghi chú." />
          <OverviewCard title="Nhắc lịch tái khám" description="Tạo lịch nhắc tái khám cho khách hàng sau khi hoàn thành dịch vụ." />
          <OverviewCard title="Thông báo" description="Theo dõi thông báo liên quan đến lịch hẹn và công việc được giao." />
        </div>
      </section>
    </div>
  );
}

function CustomerHome({
  activeServices,
  bookings,
  pets,
  services,
  session
}: HomePageProps & { activeServices: DichVuDto[] }) {
  const nextBooking = bookings[0];
  const featuredServices = [...activeServices].sort((left, right) => right.soLanDat - left.soLanDat).slice(0, 3);
  const quickService = activeServices[0] ?? services[0];
  const quickPet = pets[0];
  const quickDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const primaryPath = session ? '/customer/booking' : '/auth';
  const primaryLabel = session ? 'Đặt lịch ngay' : 'Đăng nhập đặt lịch';
  const quickBookingPath = !session ? '/auth' : quickPet ? `/customer/booking${quickService ? `?serviceId=${quickService.maDichVu}` : ''}` : '/customer/profile';
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
            <Link className="ghost-button" to={session ? '/customer/services' : '/services'}>Xem dịch vụ</Link>
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
          <Link className="text-link" to={session ? '/customer/services' : '/services'}>Xem tất cả</Link>
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
              <Link className="text-link" to={`/customer/booking?serviceId=${service.maDichVu}`}>Đặt dịch vụ</Link>
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
          <Link className="text-link" to={session ? '/customer/booking' : '/auth'}>
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
          <Link className="text-link" to="/customer/appointments">Xem tất cả</Link>
        </div>

        {nextBooking ? (
          <div className="appointment-highlight">
            <strong>{nextBooking.tenDichVu}</strong>
            <p>{nextBooking.tenThuCung}</p>
            <span>{nextBooking.ngayHen} lúc {nextBooking.gioHen}</span>
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
          <Link className="text-link" to={session ? '/customer/profile' : '/auth'}>{pets.length ? 'Quản lý hồ sơ' : 'Thêm thú cưng'}</Link>
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

function OverviewCard({ description, title }: { description: string; title: string }) {
  return (
    <article className="list-card">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </article>
  );
}

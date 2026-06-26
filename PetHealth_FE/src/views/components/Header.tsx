import { NavLink } from 'react-router-dom';
import type { AuthResponseDto } from '../types/auth';

interface HeaderProps {
  session: AuthResponseDto | null;
  onLogout: () => void;
}

const text = {
  home: 'Trang chủ',
  overview: 'Tổng quan',
  services: 'Dịch vụ',
  booking: 'Đặt lịch',
  appointments: 'Lịch hẹn',
  profile: 'Hồ sơ',
  medical: 'Hồ sơ bệnh án',
  notifications: 'Thông báo',
  admin: 'Quản trị',
  system: 'Hệ thống',
  operations: 'Vận hành',
  staffSchedule: 'Lịch phân công',
  staffWork: 'Công việc',
  guest: 'Khách truy cập',
  adminRole: 'Quản trị viên',
  staffRole: 'Nhân viên',
  customerRole: 'Khách hàng',
  title: 'Quản lý phòng khám thú cưng',
  nav: 'Chức năng',
  logout: 'Đăng xuất',
  login: 'Đăng nhập',
  aria: 'Điều hướng chính'
};

const publicLinks = [
  { to: '/', label: text.home },
  { to: '/services', label: text.services }
];

const customerLinks = [
  { to: '/customer', label: text.overview },
  { to: '/customer/services', label: text.services },
  { to: '/customer/booking', label: text.booking },
  { to: '/customer/appointments', label: text.appointments },
  { to: '/customer/profile', label: text.profile },
  { to: '/customer/medical-records', label: text.medical },
  { to: '/customer/notifications', label: text.notifications }
];

const adminLinks = [
  { to: '/admin/overview', label: text.overview },
  { to: '/admin', label: text.admin },
  { to: '/admin/system', label: text.system },
  { to: '/admin/operations', label: text.operations },
  { to: '/admin/medical-records', label: text.medical },
  { to: '/admin/notifications', label: text.notifications }
];

const staffLinks = [
  { to: '/staff/overview', label: text.overview },
  { to: '/staff', label: text.staffSchedule },
  { to: '/staff/work', label: text.staffWork },
  { to: '/staff/medical-records', label: text.medical },
  { to: '/staff/notifications', label: text.notifications }
];

function getRoleLabel(session: AuthResponseDto | null) {
  if (!session) {
    return text.guest;
  }

  if (session.user.vaiTro === 'Admin') {
    return text.adminRole;
  }

  if (session.user.vaiTro === 'Staff') {
    return text.staffRole;
  }

  return text.customerRole;
}

function getLinks(session: AuthResponseDto | null) {
  if (!session) {
    return publicLinks;
  }

  if (session.user.vaiTro === 'Admin') {
    return adminLinks;
  }

  if (session.user.vaiTro === 'Staff') {
    return staffLinks;
  }

  return customerLinks;
}

export function Header({ session, onLogout }: HeaderProps) {
  const links = getLinks(session);
  const roleLabel = getRoleLabel(session);

  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">PH</div>
        <div>
          <p className="eyebrow">PetHealth Clinic</p>
          <h1>{text.title}</h1>
        </div>
      </div>

      <nav className="nav-links" aria-label={text.aria}>
        <span className="nav-section-title">{text.nav}</span>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="session-block">
        {session ? (
          <>
            <div>
              <p className="session-name">{session.user.hoVaTen}</p>
              <p className="session-role">{roleLabel}</p>
            </div>
            <button className="ghost-button" onClick={onLogout} type="button">
              {text.logout}
            </button>
          </>
        ) : (
          <>
            <span className="session-role">{roleLabel}</span>
            <NavLink className="primary-button" to="/auth">
              {text.login}
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}

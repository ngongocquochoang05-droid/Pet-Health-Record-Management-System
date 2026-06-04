import { NavLink } from 'react-router-dom';
import type { AuthResponseDto } from '../../models/auth';

interface HeaderProps {
  session: AuthResponseDto | null;
  onLogout: () => void;
}

const text = {
  overview: 'T\u1ed5ng quan',
  services: 'D\u1ecbch v\u1ee5',
  reviews: '\u0110\u00e1nh gi\u00e1',
  booking: '\u0110\u1eb7t l\u1ecbch',
  appointments: 'L\u1ecbch h\u1eb9n',
  billing: 'H\u00f3a \u0111\u01a1n',
  rewards: '\u01afu \u0111\u00e3i/\u0110\u1eb7t c\u1ecdc',
  profile: 'H\u1ed3 s\u01a1',
  medical: 'Hồ sơ bệnh án',
  notifications: 'Thông báo',
  admin: 'Qu\u1ea3n tr\u1ecb',
  system: 'H\u1ec7 th\u1ed1ng',
  operations: 'V\u1eadn h\u00e0nh',
  staffSchedule: 'L\u1ecbch ph\u00e2n c\u00f4ng',
  staffWork: 'C\u00f4ng vi\u1ec7c',
  guest: 'Kh\u00e1ch truy c\u1eadp',
  adminRole: 'Qu\u1ea3n tr\u1ecb vi\u00ean',
  staffRole: 'Nh\u00e2n vi\u00ean',
  customerRole: 'Kh\u00e1ch h\u00e0ng',
  title: 'Qu\u1ea3n l\u00fd ph\u00f2ng kh\u00e1m th\u00fa c\u01b0ng',
  nav: 'Ch\u1ee9c n\u0103ng',
  logout: '\u0110\u0103ng xu\u1ea5t',
  login: '\u0110\u0103ng nh\u1eadp',
  aria: '\u0110i\u1ec1u h\u01b0\u1edbng ch\u00ednh'
};

const publicLinks = [
  { to: '/', label: text.overview },
  { to: '/services', label: text.services },
  { to: '/reviews', label: text.reviews }
];

const customerLinks = [
  { to: '/', label: text.overview },
  { to: '/services', label: text.services },
  { to: '/booking', label: text.booking },
  { to: '/appointments', label: text.appointments },
  { to: '/reviews', label: text.reviews },
  { to: '/billing', label: text.billing },
  { to: '/customer/rewards', label: text.rewards },
  { to: '/profile', label: text.profile }
  ,{ to: '/medical-records', label: text.medical }
  ,{ to: '/notifications', label: text.notifications }
];

const adminLinks = [
  { to: '/', label: text.overview },
  { to: '/admin', label: text.admin },
  { to: '/admin/system', label: text.system },
  { to: '/operations', label: text.operations }
  ,{ to: '/medical-records', label: text.medical }
  ,{ to: '/notifications', label: text.notifications }
];

const staffLinks = [
  { to: '/', label: text.overview },
  { to: '/staff', label: text.staffSchedule },
  { to: '/staff/work', label: text.staffWork }
  ,{ to: '/medical-records', label: text.medical }
  ,{ to: '/notifications', label: text.notifications }
];

function getRoleLabel(session: AuthResponseDto | null): string {
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

export function Header({ session, onLogout }: HeaderProps) {
  const links =
    session?.user.vaiTro === 'Customer'
      ? customerLinks
      : session?.user.vaiTro === 'Admin'
        ? adminLinks
        : session?.user.vaiTro === 'Staff'
          ? staffLinks
          : publicLinks;

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

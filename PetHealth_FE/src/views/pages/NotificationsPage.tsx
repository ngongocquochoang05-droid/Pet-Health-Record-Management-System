import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notificationApi';
import type { AuthResponseDto } from '../types/auth';
import type { NotificationDto } from '../types/notification';

export function NotificationsPage({ session }: { session: AuthResponseDto | null }) {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session) {
      void refresh();
    }
  }, [session]);

  async function refresh() {
    setItems(await getNotifications());
  }

  if (!session) {
    return <section className="content-panel"><p className="empty-state">Đăng nhập để xem thông báo.</p></section>;
  }

  return (
    <section className="content-panel full-width">
      <div className="section-head">
        <div>
          <p className="eyebrow">Cập nhật</p>
          <h2>Thông báo của bạn</h2>
        </div>
        <button
          className="ghost-button"
          onClick={() => void markAllNotificationsRead().then(refresh).catch((error) => setMessage(getApiErrorMessage(error)))}
          type="button"
        >
          Đọc tất cả
        </button>
      </div>

      <div className="stack-list">
        {items.map((item) => (
          <article className="list-card" key={item.maThongBao}>
            <div>
              <strong>{item.tieuDe}</strong>
              <p>{item.noiDung}</p>
              <small>{item.ngayTao}</small>
            </div>
            <div className="row-actions">
              {item.duongDan ? <Link className="ghost-button" to={toRoleScopedNotificationPath(item.duongDan, session)}>Mở</Link> : null}
              {!item.daDoc ? (
                <button className="ghost-button" onClick={() => void markNotificationRead(item.maThongBao).then(refresh)} type="button">
                  Đã đọc
                </button>
              ) : (
                <span>Đã đọc</span>
              )}
            </div>
          </article>
        ))}
        {!items.length ? <p className="empty-state">Chưa có thông báo.</p> : null}
      </div>

      {message ? <p className="feedback-line">{message}</p> : null}
    </section>
  );
}

function toRoleScopedNotificationPath(path: string, session: AuthResponseDto): string {
  const role = session.user.vaiTro;

  if (path === '/booking') {
    return '/customer/booking';
  }

  if (path === '/appointments') {
    return '/customer/appointments';
  }

  if (path === '/billing') {
    return '/customer/billing';
  }

  if (path === '/profile' || path === '/pets') {
    return '/customer/profile';
  }

  if (path === '/operations') {
    return '/admin/operations';
  }

  if (path === '/medical-records') {
    if (role === 'Admin') {
      return '/admin/medical-records';
    }

    if (role === 'Staff') {
      return '/staff/medical-records';
    }

    return '/customer/medical-records';
  }

  if (path === '/notifications') {
    if (role === 'Admin') {
      return '/admin/notifications';
    }

    if (role === 'Staff') {
      return '/staff/notifications';
    }

    return '/customer/notifications';
  }

  return path;
}

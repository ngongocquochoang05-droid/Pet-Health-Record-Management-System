import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../controllers/api';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../controllers/notificationApi';
import type { AuthResponseDto } from '../../models/auth';
import type { NotificationDto } from '../../models/notification';

export function NotificationsPage({ session }: { session: AuthResponseDto | null }) {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => { if (session) void refresh(); }, [session]);
  async function refresh() { setItems(await getNotifications()); }
  if (!session) return <section className="content-panel"><p className="empty-state">Đăng nhập để xem thông báo.</p></section>;
  return <section className="content-panel full-width">
    <div className="section-head"><div><p className="eyebrow">Cập nhật</p><h2>Thông báo của bạn</h2></div>
      <button className="ghost-button" type="button" onClick={() => void markAllNotificationsRead().then(refresh).catch((e) => setMessage(getApiErrorMessage(e)))}>Đọc tất cả</button>
    </div>
    <div className="stack-list">{items.map((item) => <article className="list-card" key={item.maThongBao}>
      <div><strong>{item.tieuDe}</strong><p>{item.noiDung}</p><small>{item.ngayTao}</small></div>
      <div className="row-actions">{item.duongDan ? <Link className="ghost-button" to={item.duongDan}>Mở</Link> : null}{!item.daDoc ? <button className="ghost-button" type="button" onClick={() => void markNotificationRead(item.maThongBao).then(refresh)}>Đã đọc</button> : <span>Đã đọc</span>}</div>
    </article>)}{!items.length ? <p className="empty-state">Chưa có thông báo.</p> : null}</div>
    {message ? <p className="feedback-line">{message}</p> : null}
  </section>;
}

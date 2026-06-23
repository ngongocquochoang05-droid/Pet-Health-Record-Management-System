import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../api/api';
import { createReview, getReviews } from '../api/featureApi';
import type { AuthResponseDto } from '../types/auth';
import { LICH_HEN_STATUS, type LichHenDto } from '../types/booking';
import type { DanhGiaDto } from '../types/features';

interface ReviewsPageProps {
  session: AuthResponseDto | null;
  bookings: LichHenDto[];
}

export function ReviewsPage({ session, bookings }: ReviewsPageProps) {
  const [reviews, setReviews] = useState<DanhGiaDto[]>([]);
  const [maLichHen, setMaLichHen] = useState<number>(0);
  const [soSao, setSoSao] = useState<number>(5);
  const [nhanXet, setNhanXet] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const completedBookings = bookings.filter((booking) => booking.trangThai === LICH_HEN_STATUS.Completed);
  const averageScore = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    return reviews.reduce((sum, review) => sum + review.soSao, 0) / reviews.length;
  }, [reviews]);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh(): Promise<void> {
    setReviews(await getReviews());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session) {
      setMessage('Bạn cần đăng nhập để gửi đánh giá.');
      return;
    }

    try {
      await createReview({ maLichHen, soSao, nhanXet });
      setNhanXet('');
      setMaLichHen(0);
      setMessage('Đã gửi đánh giá.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="split-grid">
      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Đánh giá</p>
            <h2>Gửi nhận xét sau dịch vụ</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Lịch đã hoàn thành
            <select disabled={!session} value={maLichHen} onChange={(event) => setMaLichHen(Number(event.target.value))}>
              <option value={0}>Chọn lịch hẹn</option>
              {completedBookings.map((booking) => (
                <option key={booking.maLichHen} value={booking.maLichHen}>
                  {booking.tenDichVu} - {booking.ngayHen} {booking.gioHen}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số sao
            <input min="1" max="5" type="number" value={soSao} onChange={(event) => setSoSao(Number(event.target.value))} />
          </label>
          <label className="full-span">
            Nhận xét
            <textarea rows={4} value={nhanXet} onChange={(event) => setNhanXet(event.target.value)} />
          </label>
          <button className="primary-button" disabled={!session || !maLichHen} type="submit">Gửi đánh giá</button>
        </form>
        {message ? <p className="feedback-line">{message}</p> : null}
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Khách hàng nói gì</p>
            <h2>Điểm trung bình {reviews.length ? averageScore.toFixed(1) : '0.0'}/5</h2>
          </div>
        </div>
        <div className="stack-list">
          {reviews.map((review) => (
            <article className="list-card" key={review.maDanhGia}>
              <div>
                <strong>{review.tenDichVu ?? 'Dịch vụ'}</strong>
                <p>{review.soSao}/5 sao - {review.nhanXet ?? 'Không có nhận xét'}</p>
              </div>
              <span>{review.tenKhachHang}</span>
            </article>
          ))}
          {reviews.length === 0 ? <p className="empty-state">Chưa có đánh giá nào.</p> : null}
        </div>
      </section>
    </div>
  );
}

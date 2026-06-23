import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api';
import { getInvoices, getMyVouchers, getPromotions } from '../api/featureApi';
import type { AuthResponseDto } from '../types/auth';
import type { ChuongTrinhUuDaiDto, HoaDonDto, PhieuUuDaiDto } from '../types/features';

interface BillingPageProps {
  session: AuthResponseDto | null;
}

export function BillingPage({ session }: BillingPageProps) {
  const [invoices, setInvoices] = useState<HoaDonDto[]>([]);
  const [promotions, setPromotions] = useState<ChuongTrinhUuDaiDto[]>([]);
  const [vouchers, setVouchers] = useState<PhieuUuDaiDto[]>([]);
  const [message, setMessage] = useState<string>('');

  function formatDiscount(item: { loaiGiamGia?: string | null; giaTriGiam?: number }): string {
    if (item.loaiGiamGia === 'Percent') {
      return `Giảm ${item.giaTriGiam ?? 0}%`;
    }
    if (item.loaiGiamGia === 'Fixed') {
      return `Giảm ${new Intl.NumberFormat('vi-VN').format(item.giaTriGiam ?? 0)} VND`;
    }
    return 'Miễn phí toàn bộ';
  }

  useEffect(() => {
    if (!session || session.user.vaiTro !== 'Customer') {
      return;
    }

    void Promise.all([getInvoices(), getPromotions(), getMyVouchers()])
      .then(([invoiceData, promotionData, voucherData]) => {
        setInvoices(invoiceData);
        setPromotions(promotionData);
        setVouchers(voucherData);
      })
      .catch((error) => setMessage(getApiErrorMessage(error)));
  }, [session]);

  if (!session) {
    return <section className="content-panel"><p className="empty-state">Đăng nhập để xem hóa đơn và ưu đãi.</p></section>;
  }

  if (session.user.vaiTro !== 'Customer') {
    return <Navigate replace to={session.user.vaiTro === 'Admin' ? '/admin/overview' : '/staff/overview'} />;
  }

  return (
    <div className="page-grid">
      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Hóa đơn</p>
            <h2>Lịch sử thanh toán</h2>
          </div>
        </div>
        <div className="stack-list">
          {invoices.map((invoice) => (
            <article className="list-card" key={invoice.maHoaDon}>
              <div>
                <strong>Hóa đơn #{invoice.maHoaDon}</strong>
                <p>{invoice.trangThaiThanhToan ?? 'Unpaid'} - {invoice.phuongThucThanhToan ?? 'Chưa chọn'}</p>
                {invoice.tenUuDai ? <p>Đã áp dụng: {invoice.tenUuDai} - {formatDiscount(invoice)}</p> : null}
              </div>
              <span>
                {invoice.tenUuDai ? <small>{new Intl.NumberFormat('vi-VN').format(invoice.tongTienTruocUuDai)} VND → </small> : null}
                {new Intl.NumberFormat('vi-VN').format(invoice.tongTien)} VND
              </span>
            </article>
          ))}
          {invoices.length === 0 ? <p className="empty-state">Chưa có hóa đơn nào.</p> : null}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Ưu đãi</p>
            <h2>Chương trình đang áp dụng</h2>
          </div>
        </div>
        <div className="stack-list">
          {promotions.map((promotion) => (
            <article className="list-card" key={promotion.maUuDai}>
              <strong>{promotion.tenUuDai}</strong>
              <span>{formatDiscount(promotion)} - {promotion.thoiHanThang} tháng</span>
            </article>
          ))}
          {promotions.length === 0 ? <p className="empty-state">Chưa có ưu đãi đang hoạt động.</p> : null}
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head">
          <div>
            <p className="eyebrow">Phiếu ưu đãi</p>
            <h2>Ưu đãi của bạn</h2>
          </div>
        </div>
        <div className="stack-list">
          {vouchers.map((voucher) => (
            <article className="list-card" key={voucher.maPhieu}>
              <div>
                <strong>{voucher.tenUuDai}</strong>
                <p>{formatDiscount(voucher)} - Hạn dùng: {voucher.hanSuDung ?? 'Chưa có'}</p>
              </div>
              <span>{voucher.daSuDung ? 'Đã dùng' : 'Chưa dùng'}</span>
            </article>
          ))}
          {vouchers.length === 0 ? <p className="empty-state">Chưa có phiếu ưu đãi nào.</p> : null}
        </div>
      </section>

      {message ? <p className="feedback-line">{message}</p> : null}
    </div>
  );
}

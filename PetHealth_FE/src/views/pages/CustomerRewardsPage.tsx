import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../controllers/api';
import { claimLoyaltyVoucher, createBankTransferDeposit, getDeposits, uploadDepositReceipt } from '../../controllers/featureApi';
import type { AuthResponseDto } from '../../models/auth';
import type { LichHenDto } from '../../models/booking';
import type { BankTransferInfoDto, DepositDto } from '../../models/features';

interface CustomerRewardsPageProps {
  session: AuthResponseDto | null;
  bookings: LichHenDto[];
}

const currencyFormatter = new Intl.NumberFormat('vi-VN');

function translateDepositStatus(status: string): string {
  if (status === 'Paid') {
    return 'Đã xác nhận';
  }

  if (status === 'Pending') {
    return 'Chờ gửi biên lai';
  }

  if (status === 'Submitted') {
    return 'Đang chờ Admin kiểm tra';
  }

  if (status === 'Rejected') {
    return 'Biên lai bị từ chối';
  }

  if (status === 'Failed') {
    return 'Không hợp lệ';
  }

  return status;
}

function translatePaymentMethod(method: string): string {
  if (method === 'BANK_TRANSFER') {
    return 'Chuyển khoản ngân hàng';
  }

  if (method === 'VNPAY') {
    return 'VNPay';
  }

  if (method === 'MOMO') {
    return 'MoMo';
  }

  return method;
}

export function CustomerRewardsPage({ session, bookings }: CustomerRewardsPageProps) {
  const [deposits, setDeposits] = useState<DepositDto[]>([]);
  const [depositForm, setDepositForm] = useState({ maLichHen: 0, soTien: 50000 });
  const [bankTransfer, setBankTransfer] = useState<BankTransferInfoDto | null>(null);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [voucherSubmitting, setVoucherSubmitting] = useState(false);
  const [receiptDepositId, setReceiptDepositId] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session?.user.vaiTro === 'Customer') {
      void refresh();
    }
  }, [session]);

  async function refresh(): Promise<void> {
    setDeposits(await getDeposits());
  }

  async function handleDepositSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setDepositSubmitting(true);
    try {
      const result = await createBankTransferDeposit(depositForm);
      setBankTransfer(result.bankTransfer);
      setMessage('Đã tạo yêu cầu đặt cọc. Vui lòng chuyển khoản đúng nội dung để admin xác nhận.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setDepositSubmitting(false);
    }
  }

  async function handleClaimVoucher(): Promise<void> {
    setVoucherSubmitting(true);
    try {
      await claimLoyaltyVoucher();
      setMessage('Đã kiểm tra và cấp ưu đãi nếu đủ điều kiện.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setVoucherSubmitting(false);
    }
  }

  async function handleReceiptSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!receiptDepositId || !receiptFile) {
      setMessage('Vui lòng chọn biên lai cần gửi.');
      return;
    }

    setReceiptSubmitting(true);
    try {
      await uploadDepositReceipt(receiptDepositId, receiptFile, receiptNote);
      setReceiptDepositId(null);
      setReceiptFile(null);
      setReceiptNote('');
      setMessage('Đã gửi biên lai. Admin sẽ kiểm tra và xác nhận đặt cọc.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setReceiptSubmitting(false);
    }
  }

  if (session?.user.vaiTro !== 'Customer') {
    return <section className="content-panel"><p className="empty-state">Chỉ khách hàng mới truy cập màn hình này.</p></section>;
  }

  return (
    <div className="page-grid">
      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Đặt cọc</p>
            <h2>Đặt cọc bằng chuyển khoản ngân hàng</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleDepositSubmit}>
          <label>
            Lịch hẹn
            <select value={depositForm.maLichHen} onChange={(event) => setDepositForm((current) => ({ ...current, maLichHen: Number(event.target.value) }))}>
              <option value={0}>Chọn lịch hẹn</option>
              {bookings.map((booking) => (
                <option key={booking.maLichHen} value={booking.maLichHen}>
                  {booking.tenDichVu} - {booking.ngayHen}
                </option>
              ))}
            </select>
          </label>

          <label>
            Số tiền đặt cọc
            <input min="10000" type="number" value={depositForm.soTien} onChange={(event) => setDepositForm((current) => ({ ...current, soTien: Number(event.target.value) }))} />
          </label>

          <button className={`primary-button${depositSubmitting ? ' is-loading' : ''}`} disabled={depositSubmitting} type="submit">
            {depositSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu đặt cọc'}
          </button>
        </form>

        {bankTransfer ? (
          <article className="list-card space-top">
            <div>
              <strong>Thông tin chuyển khoản</strong>
              <p>Ngân hàng: {bankTransfer.bankName}</p>
              <p>Số tài khoản: {bankTransfer.accountNumber}</p>
              <p>Chủ tài khoản: {bankTransfer.accountName}</p>
              <p>Nội dung chuyển khoản: <strong>{bankTransfer.transferContent}</strong></p>
              <p>{bankTransfer.note}</p>
            </div>
          </article>
        ) : (
          <p className="empty-state">Sau khi tạo yêu cầu đặt cọc, hệ thống sẽ hiển thị thông tin chuyển khoản để bạn thanh toán thủ công.</p>
        )}
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Khuyến mãi</p>
            <h2>Miễn phí 1 lần khám sau 3 lần hoàn thành</h2>
          </div>
        </div>
        <p className="empty-state">Hệ thống kiểm tra số lịch đã hoàn thành và cấp phiếu ưu đãi nếu đủ điều kiện.</p>
        <button className={`primary-button${voucherSubmitting ? ' is-loading' : ''}`} disabled={voucherSubmitting} type="button" onClick={() => void handleClaimVoucher()}>
          {voucherSubmitting ? 'Đang kiểm tra...' : 'Nhận ưu đãi'}
        </button>
      </section>

      <section className="content-panel full-width">
        <div className="section-head">
          <div>
            <p className="eyebrow">Thanh toán</p>
            <h2>Lịch sử đặt cọc của tôi</h2>
          </div>
        </div>
        <div className="stack-list">
          {deposits.map((deposit) => (
            <article className="list-card" key={deposit.maDatCoc}>
              <div>
                <strong>{deposit.maGiaoDich}</strong>
                <p>{currencyFormatter.format(deposit.soTien)} VND - {translatePaymentMethod(deposit.phuongThuc)}</p>
                {deposit.lyDoTuChoi ? <p>Lý do từ chối: {deposit.lyDoTuChoi}</p> : null}
                {deposit.bienLaiUrl ? <a href={deposit.bienLaiUrl} rel="noreferrer" target="_blank">Xem biên lai đã gửi</a> : null}
              </div>
              <div className="row-actions">
                <span>{translateDepositStatus(deposit.trangThai)}</span>
                {deposit.trangThai !== 'Paid' ? (
                  <button className="ghost-button" type="button" onClick={() => setReceiptDepositId(deposit.maDatCoc)}>
                    {deposit.bienLaiUrl ? 'Gửi lại biên lai' : 'Gửi biên lai'}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {deposits.length === 0 ? <p className="empty-state">Bạn chưa có yêu cầu đặt cọc nào.</p> : null}
        </div>
        {receiptDepositId ? (
          <form className="form-grid space-top" onSubmit={handleReceiptSubmit}>
            <label className="full-span">
              Ảnh hoặc PDF biên lai
              <input accept="image/jpeg,image/png,image/webp,application/pdf" required type="file" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} />
            </label>
            <label className="full-span">
              Ghi chú chuyển khoản
              <textarea rows={2} value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} />
            </label>
            <div className="row-actions">
              <button className={`primary-button${receiptSubmitting ? ' is-loading' : ''}`} disabled={receiptSubmitting} type="submit">
                {receiptSubmitting ? 'Đang gửi...' : 'Gửi biên lai'}
              </button>
              <button className="ghost-button" type="button" onClick={() => setReceiptDepositId(null)}>Hủy</button>
            </div>
          </form>
        ) : null}
      </section>

      {message ? <p className="feedback-line">{message}</p> : null}
    </div>
  );
}

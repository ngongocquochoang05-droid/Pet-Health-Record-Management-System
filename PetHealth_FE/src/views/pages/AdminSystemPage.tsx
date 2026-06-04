import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../controllers/api';
import { createReminder, getCustomerUsage, getDeposits, getReminders, issuePetQr, reviewDeposit } from '../../controllers/featureApi';
import type { AuthResponseDto } from '../../models/auth';
import type { CustomerUsageDto, DepositDto, PetQrDto, ReminderDto } from '../../models/features';

interface AdminSystemPageProps {
  session: AuthResponseDto | null;
}

export function AdminSystemPage({ session }: AdminSystemPageProps) {
  const [customers, setCustomers] = useState<CustomerUsageDto[]>([]);
  const [deposits, setDeposits] = useState<DepositDto[]>([]);
  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [qr, setQr] = useState<PetQrDto | null>(null);
  const [petCode, setPetCode] = useState('');
  const [reminderForm, setReminderForm] = useState({ maLichHen: 0, ngayTaiKham: '', noiDung: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session?.user.vaiTro === 'Admin') {
      void refresh();
    }
  }, [session]);

  async function refresh(): Promise<void> {
    const [customerData, depositData, reminderData] = await Promise.all([getCustomerUsage(), getDeposits(), getReminders()]);
    setCustomers(customerData);
    setDeposits(depositData);
    setReminders(reminderData);
  }

  async function handleIssueQr(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const data = await issuePetQr(Number(petCode));
      setQr(data);
      setMessage('Đã cấp mã QR và gửi email cho chủ thú cưng.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleReminderSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await createReminder(reminderForm);
      setReminderForm({ maLichHen: 0, ngayTaiKham: '', noiDung: '' });
      setMessage('Đã tạo nhắc lịch tái khám và gửi email.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleDepositReview(deposit: DepositDto, approved: boolean): Promise<void> {
    const rejectionReason = approved ? undefined : window.prompt('Nhập lý do từ chối biên lai:')?.trim();
    if (!approved && !rejectionReason) {
      return;
    }

    try {
      await reviewDeposit(deposit.maDatCoc, approved, rejectionReason);
      setMessage(approved ? 'Đã xác nhận đặt cọc.' : 'Đã từ chối biên lai.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  if (session?.user.vaiTro !== 'Admin') {
    return <section className="content-panel"><p className="empty-state">Chỉ tài khoản Admin mới truy cập màn hình này.</p></section>;
  }

  return (
    <div className="page-grid">
      <section className="content-panel full-width">
        <div className="section-head"><div><p className="eyebrow">Khách hàng</p><h2>Dịch vụ đã dùng và số lần đăng nhập</h2></div></div>
        <div className="table-shell">
          <table>
            <thead><tr><th>Khách hàng</th><th>Email</th><th>Đăng nhập</th><th>Lịch hoàn thành</th><th>Dịch vụ đã dùng</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.maKhachHang}>
                  <td>{customer.hoVaTen}</td>
                  <td>{customer.email}</td>
                  <td>{customer.loginCount}</td>
                  <td>{customer.soLanHoanThanh}</td>
                  <td>{customer.dichVuDaDung ?? 'Chưa có'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head"><div><p className="eyebrow">QR thú cưng</p><h2>Cấp mã QR lần đầu</h2></div></div>
        <form className="form-grid" onSubmit={handleIssueQr}>
          <label>Mã thú cưng<input value={petCode} onChange={(event) => setPetCode(event.target.value)} /></label>
          <button className="primary-button" type="submit">Cấp QR</button>
        </form>
        {qr?.qrCodeUrl ? <article className="list-card space-top"><div><strong>{qr.tenThuCung}</strong><p>{qr.maQr}</p></div><img alt="QR thú cưng" src={qr.qrCodeUrl} width={120} height={120} /></article> : null}
      </section>

      <section className="content-panel">
        <div className="section-head"><div><p className="eyebrow">Tái khám</p><h2>Tạo nhắc lịch qua email</h2></div></div>
        <form className="form-grid" onSubmit={handleReminderSubmit}>
          <label>Lịch hẹn<input type="number" value={reminderForm.maLichHen} onChange={(event) => setReminderForm((current) => ({ ...current, maLichHen: Number(event.target.value) }))} /></label>
          <label>Ngày tái khám<input type="date" value={reminderForm.ngayTaiKham} onChange={(event) => setReminderForm((current) => ({ ...current, ngayTaiKham: event.target.value }))} /></label>
          <label className="full-span">Nội dung<textarea rows={3} value={reminderForm.noiDung} onChange={(event) => setReminderForm((current) => ({ ...current, noiDung: event.target.value }))} /></label>
          <button className="primary-button" type="submit">Tạo nhắc lịch</button>
        </form>
      </section>

      <section className="content-panel full-width">
        <div className="section-head"><div><p className="eyebrow">Thanh toán</p><h2>Lịch sử đặt cọc</h2></div></div>
        <div className="stack-list">
          {deposits.map((deposit) => (
            <article className="list-card" key={deposit.maDatCoc}>
              <div>
                <strong>{deposit.maGiaoDich}</strong>
                <p>{deposit.tenKhachHang} - {new Intl.NumberFormat('vi-VN').format(deposit.soTien)} VND - {deposit.trangThai}</p>
                {deposit.ghiChuKhachHang ? <p>Ghi chú: {deposit.ghiChuKhachHang}</p> : null}
                {deposit.lyDoTuChoi ? <p>Lý do từ chối: {deposit.lyDoTuChoi}</p> : null}
                {deposit.bienLaiUrl ? <a href={deposit.bienLaiUrl} rel="noreferrer" target="_blank">Mở biên lai</a> : <p>Khách hàng chưa gửi biên lai.</p>}
              </div>
              {deposit.trangThai !== 'Paid' ? (
                <div className="row-actions">
                  <button className="primary-button" disabled={!deposit.bienLaiUrl} onClick={() => void handleDepositReview(deposit, true)} type="button">Xác nhận</button>
                  <button className="ghost-button" disabled={!deposit.bienLaiUrl} onClick={() => void handleDepositReview(deposit, false)} type="button">Từ chối</button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head"><div><p className="eyebrow">Reminder</p><h2>Danh sách nhắc lịch</h2></div></div>
        <div className="stack-list">
          {reminders.map((reminder) => <article className="list-card" key={reminder.maNhacLich}><strong>{reminder.email}</strong><span>{reminder.ngayTaiKham} - {reminder.trangThai}</span></article>)}
        </div>
      </section>

      {message ? <p className="feedback-line">{message}</p> : null}
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/api';
import { getBookings } from '../api/bookingApi';
import { createReminder, getCustomerUsage, getDeposits, getReminders, issuePetQr, reviewDeposit } from '../api/featureApi';
import { getAdminUsers } from '../api/managementApi';
import { getPets } from '../api/petApi';
import type { AuthResponseDto } from '../types/auth';
import type { LichHenDto } from '../types/booking';
import type { CustomerUsageDto, DepositDto, PetQrDto, ReminderDto } from '../types/features';
import type { ThuCungDto } from '../types/pet';
import type { NguoiDungDto } from '../types/user';

interface AdminSystemPageProps {
  session: AuthResponseDto | null;
}

export function AdminSystemPage({ session }: AdminSystemPageProps) {
  const [customers, setCustomers] = useState<CustomerUsageDto[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<NguoiDungDto[]>([]);
  const [customerPets, setCustomerPets] = useState<ThuCungDto[]>([]);
  const [deposits, setDeposits] = useState<DepositDto[]>([]);
  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [qr, setQr] = useState<PetQrDto | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState(0);
  const [reminderCustomerId, setReminderCustomerId] = useState('');
  const [reminderPets, setReminderPets] = useState<ThuCungDto[]>([]);
  const [reminderPetId, setReminderPetId] = useState(0);
  const [reminderBookings, setReminderBookings] = useState<LichHenDto[]>([]);
  const [reminderForm, setReminderForm] = useState({ maLichHen: 0, ngayTaiKham: '', noiDung: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session?.user.vaiTro === 'Admin') {
      void refresh();
    }
  }, [session]);

  async function refresh(): Promise<void> {
    const [customerData, customerAccountData, depositData, reminderData] = await Promise.all([
      getCustomerUsage(),
      getAdminUsers('Customer'),
      getDeposits(),
      getReminders()
    ]);
    setCustomers(customerData);
    setCustomerAccounts(customerAccountData);
    setDeposits(depositData);
    setReminders(reminderData);
  }

  async function handleCustomerChange(maNguoiDung: string): Promise<void> {
    setSelectedCustomerId(maNguoiDung);
    setSelectedPetId(0);
    setQr(null);

    if (!maNguoiDung) {
      setCustomerPets([]);
      return;
    }

    try {
      const pets = await getPets(maNguoiDung);
      setCustomerPets(pets);
      setSelectedPetId(pets[0]?.maThuCung ?? 0);
    } catch (error) {
      setCustomerPets([]);
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleIssueQr(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedPetId) {
      setMessage('Vui lòng chọn khách hàng và thú cưng trước khi cấp QR.');
      return;
    }

    try {
      const data = await issuePetQr(selectedPetId);
      setQr(data);
      setMessage('Đã cấp mã QR và gửi email cho chủ thú cưng.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleReminderCustomerChange(maNguoiDung: string): Promise<void> {
    setReminderCustomerId(maNguoiDung);
    setReminderPetId(0);
    setReminderPets([]);
    setReminderBookings([]);
    setReminderForm((current) => ({ ...current, maLichHen: 0 }));

    if (!maNguoiDung) {
      return;
    }

    try {
      const [pets, bookings] = await Promise.all([getPets(maNguoiDung), getBookings(maNguoiDung)]);
      setReminderPets(pets);
      setReminderBookings(bookings);
      setReminderPetId(pets[0]?.maThuCung ?? 0);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  function handleReminderPetChange(maThuCung: number): void {
    setReminderPetId(maThuCung);
    setReminderForm((current) => ({ ...current, maLichHen: 0 }));
  }

  async function handleReminderSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!reminderForm.maLichHen) {
      setMessage('Vui lòng chọn lịch hẹn đã hoàn thành trước khi tạo nhắc lịch tái khám.');
      return;
    }

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

  const completedReminderBookings = reminderBookings.filter(
    (booking) => booking.maThuCung === reminderPetId && booking.trangThai === 'Completed'
  );

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
          <label>
            Khách hàng
            <select value={selectedCustomerId} onChange={(event) => void handleCustomerChange(event.target.value)}>
              <option value="">Chọn khách hàng</option>
              {customerAccounts.map((customer) => (
                <option key={customer.maNguoiDung} value={customer.maNguoiDung}>
                  {customer.hoVaTen} - {customer.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Thú cưng
            <select
              disabled={!selectedCustomerId || customerPets.length === 0}
              value={selectedPetId}
              onChange={(event) => setSelectedPetId(Number(event.target.value))}
            >
              <option value={0}>{selectedCustomerId ? 'Chọn thú cưng' : 'Chọn khách hàng trước'}</option>
              {customerPets.map((pet) => (
                <option key={pet.maThuCung} value={pet.maThuCung}>
                  {pet.tenThuCung} - {pet.giong}
                </option>
              ))}
            </select>
          </label>
          {selectedCustomerId && customerPets.length === 0 ? <p className="empty-state full-span">Khách hàng này chưa có hồ sơ thú cưng.</p> : null}
          <button className="primary-button" disabled={!selectedPetId} type="submit">Cấp QR</button>
        </form>
        {qr?.qrCodeUrl ? <article className="list-card space-top"><div><strong>{qr.tenThuCung}</strong><p>{qr.maQr}</p></div><img alt="QR thú cưng" src={qr.qrCodeUrl} width={120} height={120} /></article> : null}
      </section>

      <section className="content-panel">
        <div className="section-head"><div><p className="eyebrow">Tái khám</p><h2>Tạo nhắc lịch tái khám</h2></div></div>
        <form className="form-grid" onSubmit={handleReminderSubmit}>
          <label>
            Khách hàng
            <select value={reminderCustomerId} onChange={(event) => void handleReminderCustomerChange(event.target.value)}>
              <option value="">Chọn khách hàng</option>
              {customerAccounts.map((customer) => (
                <option key={customer.maNguoiDung} value={customer.maNguoiDung}>
                  {customer.hoVaTen} - {customer.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Thú cưng
            <select
              disabled={!reminderCustomerId || reminderPets.length === 0}
              value={reminderPetId}
              onChange={(event) => handleReminderPetChange(Number(event.target.value))}
            >
              <option value={0}>{reminderCustomerId ? 'Chọn thú cưng' : 'Chọn khách hàng trước'}</option>
              {reminderPets.map((pet) => (
                <option key={pet.maThuCung} value={pet.maThuCung}>
                  {pet.tenThuCung} - {pet.giong}
                </option>
              ))}
            </select>
          </label>
          <label className="full-span">
            Lịch hẹn đã hoàn thành
            <select
              disabled={!reminderPetId || completedReminderBookings.length === 0}
              value={reminderForm.maLichHen}
              onChange={(event) => setReminderForm((current) => ({ ...current, maLichHen: Number(event.target.value) }))}
            >
              <option value={0}>{reminderPetId ? 'Chọn lịch hẹn' : 'Chọn thú cưng trước'}</option>
              {completedReminderBookings.map((booking) => (
                <option key={booking.maLichHen} value={booking.maLichHen}>
                  #{booking.maLichHen} - {booking.tenDichVu} - {booking.ngayHen} {booking.gioHen}
                </option>
              ))}
            </select>
          </label>
          {reminderPetId && completedReminderBookings.length === 0 ? <p className="empty-state full-span">Thú cưng này chưa có lịch hẹn đã hoàn thành.</p> : null}
          <label>Ngày tái khám<input type="date" value={reminderForm.ngayTaiKham} onChange={(event) => setReminderForm((current) => ({ ...current, ngayTaiKham: event.target.value }))} /></label>
          <label className="full-span">Nội dung<textarea rows={3} value={reminderForm.noiDung} onChange={(event) => setReminderForm((current) => ({ ...current, noiDung: event.target.value }))} /></label>
          <button className="primary-button" disabled={!reminderForm.maLichHen} type="submit">Tạo nhắc lịch</button>
        </form>
        <form className="form-grid" style={{ display: 'none' }} onSubmit={handleReminderSubmit}>
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

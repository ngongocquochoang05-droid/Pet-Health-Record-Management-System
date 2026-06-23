import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { StatusPill } from '../components/StatusPill';
import { getApiErrorMessage } from '../api/api';
import { updateBooking, updateBookingStatus } from '../api/bookingApi';
import type { AuthResponseDto } from '../types/auth';
import { LICH_HEN_STATUS, type LichHenDto, type UpdateLichHenDto } from '../types/booking';
import type { ThuCungDto } from '../types/pet';
import type { DichVuDto } from '../types/service';

interface AppointmentsPageProps {
  session: AuthResponseDto | null;
  bookings: LichHenDto[];
  pets: ThuCungDto[];
  services: DichVuDto[];
  onBookingsChanged: () => Promise<void>;
}

export function AppointmentsPage({ session, bookings, pets, services, onBookingsChanged }: AppointmentsPageProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UpdateLichHenDto | null>(null);

  function beginEdit(booking: LichHenDto): void {
    setEditingId(booking.maLichHen);
    setForm({
      maThuCung: booking.maThuCung,
      maDichVu: booking.maDichVu,
      maDichVus: booking.maDichVus.length ? booking.maDichVus : [booking.maDichVu],
      ngayHen: booking.ngayHen,
      gioHen: booking.gioHen,
      ghiChu: booking.ghiChu ?? ''
    });
  }

  function toggleService(serviceId: number): void {
    setForm((current) => {
      if (!current) {
        return current;
      }

      const isSelected = current.maDichVus.includes(serviceId);
      const maDichVus = isSelected
        ? current.maDichVus.filter((id) => id !== serviceId)
        : [...current.maDichVus, serviceId];
      return { ...current, maDichVus, maDichVu: maDichVus[0] ?? 0 };
    });
  }

  async function handleCancel(bookingId: number): Promise<void> {
    try {
      await updateBookingStatus(bookingId, { trangThai: LICH_HEN_STATUS.Cancelled });
      await onBookingsChanged();
    } catch (error) {
      window.alert(getApiErrorMessage(error));
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editingId || !form) {
      return;
    }

    try {
      await updateBooking(editingId, form);
      setEditingId(null);
      setForm(null);
      await onBookingsChanged();
    } catch (error) {
      window.alert(getApiErrorMessage(error));
    }
  }

  if (!session) {
    return <section className="content-panel"><p className="empty-state">Đăng nhập để xem lịch hẹn.</p></section>;
  }

  if (session.user.vaiTro !== 'Customer') {
    return <Navigate replace to={session.user.vaiTro === 'Admin' ? '/admin/overview' : '/staff/overview'} />;
  }

  return (
    <section className="content-panel full-width">
      <div className="section-head">
        <div>
          <p className="eyebrow">Quản lý lịch hẹn</p>
          <h2>Danh sách lịch đã tạo</h2>
        </div>
      </div>

      {form ? (
        <form className="form-grid space-bottom" onSubmit={handleUpdate}>
          <label>
            Thú cưng
            <select value={form.maThuCung} onChange={(event) => setForm((current) => current && { ...current, maThuCung: Number(event.target.value) })}>
              {pets.map((pet) => <option key={pet.maThuCung} value={pet.maThuCung}>{pet.tenThuCung}</option>)}
            </select>
          </label>
          <fieldset className="service-picker full-span">
            <legend>Dịch vụ</legend>
            <div className="service-picker__grid">
              {services.map((service) => (
                <label className="service-picker__option" key={service.maDichVu}>
                  <input checked={form.maDichVus.includes(service.maDichVu)} onChange={() => toggleService(service.maDichVu)} type="checkbox" />
                  <span><strong>{service.tenDichVu}</strong><small>{new Intl.NumberFormat('vi-VN').format(service.giaTien)} VND</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>Ngày hẹn<input type="date" value={form.ngayHen} onChange={(event) => setForm((current) => current && { ...current, ngayHen: event.target.value })} /></label>
          <label>Giờ hẹn<input type="time" value={form.gioHen} onChange={(event) => setForm((current) => current && { ...current, gioHen: event.target.value })} /></label>
          <label className="full-span">Ghi chú<textarea rows={3} value={form.ghiChu ?? ''} onChange={(event) => setForm((current) => current && { ...current, ghiChu: event.target.value })} /></label>
          <div className="row-actions">
            <button className="primary-button" disabled={!form.maDichVus.length} type="submit">Lưu lịch hẹn</button>
            <button className="ghost-button" onClick={() => { setEditingId(null); setForm(null); }} type="button">Hủy sửa</button>
          </div>
        </form>
      ) : null}

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Thú cưng</th>
              <th>Dịch vụ</th>
              <th>Ngày</th>
              <th>Giờ</th>
              <th>Trạng thái</th>
              <th>Tổng tiền</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const canChange = booking.trangThai !== LICH_HEN_STATUS.Cancelled && booking.trangThai !== LICH_HEN_STATUS.Completed && booking.trangThai !== LICH_HEN_STATUS.NoShow;
              return (
                <tr key={booking.maLichHen}>
                  <td>{booking.tenKhachHang}</td>
                  <td>{booking.tenThuCung}</td>
                  <td>{booking.tenDichVu}</td>
                  <td>{booking.ngayHen}</td>
                  <td>{booking.gioHen}</td>
                  <td><StatusPill status={booking.trangThai} /></td>
                  <td>{new Intl.NumberFormat('vi-VN').format(booking.tongTien)} VND</td>
                  <td className="row-actions">
                    {canChange ? <button className="ghost-button" onClick={() => beginEdit(booking)} type="button">Sửa</button> : null}
                    {canChange ? <button className="ghost-button" onClick={() => void handleCancel(booking.maLichHen)} type="button">Hủy</button> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bookings.length === 0 ? <p className="empty-state">Chưa có lịch hẹn nào.</p> : null}
      </div>
    </section>
  );
}

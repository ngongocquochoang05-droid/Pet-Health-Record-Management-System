import { useEffect, useMemo, useState } from 'react';
import { StatusPill } from '../components/StatusPill';
import { getApiErrorMessage } from '../../controllers/api';
import { getStaffAppointments, updateStaffAppointmentStatus } from '../../controllers/managementApi';
import type { AuthResponseDto } from '../../models/auth';
import { LICH_HEN_STATUS, type LichHenDto, type LichHenStatus } from '../../models/booking';

interface StaffPageProps {
  session: AuthResponseDto | null;
}

export function StaffPage({ session }: StaffPageProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [appointments, setAppointments] = useState<LichHenDto[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [note, setNote] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const visibleAppointments = useMemo(
    () => appointments.filter((item) => !selectedDate || item.ngayHen === selectedDate),
    [appointments, selectedDate]
  );

  useEffect(() => {
    if (!session || (session.user.vaiTro !== 'Staff' && session.user.vaiTro !== 'Admin')) {
      return;
    }

    void refresh();
  }, [session]);

  async function refresh(): Promise<void> {
    if (!session) {
      return;
    }

    setAppointments(await getStaffAppointments(session.user.maNguoiDung));
  }

  async function handleStatus(maLichHen: number, trangThai: LichHenStatus): Promise<void> {
    try {
      await updateStaffAppointmentStatus(maLichHen, { trangThai, ghiChu: note || null });
      setNote('');
      setMessage('Đã cập nhật lịch hẹn.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  if (!session || (session.user.vaiTro !== 'Staff' && session.user.vaiTro !== 'Admin')) {
    return <section className="content-panel"><p className="empty-state">Chỉ nhân viên mới truy cập được màn hình này.</p></section>;
  }

  return (
    <section className="content-panel full-width">
      <div className="section-head">
        <div>
          <p className="eyebrow">Nhân viên</p>
          <h2>Lịch hẹn được phân công</h2>
        </div>
      </div>

      <div className="form-grid">
        <label>Ngày làm việc<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        <label className="full-span">Ghi chú sau dịch vụ<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label>
      </div>

      {message ? <p className="feedback-line">{message}</p> : null}
      <div className="table-shell space-top">
        <table>
          <thead>
            <tr>
              <th>Khách</th>
              <th>Thú cưng</th>
              <th>Dịch vụ</th>
              <th>Ngày giờ</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {visibleAppointments.map((item) => (
              <tr key={item.maLichHen}>
                <td>{item.tenKhachHang}</td>
                <td>{item.tenThuCung}</td>
                <td>{item.tenDichVu}</td>
                <td>{item.ngayHen} {item.gioHen}</td>
                <td><StatusPill status={item.trangThai} /></td>
                <td className="row-actions">
                  <button className="ghost-button" type="button" onClick={() => void handleStatus(item.maLichHen, LICH_HEN_STATUS.Completed)}>Hoàn thành</button>
                  <button className="ghost-button" type="button" onClick={() => void handleStatus(item.maLichHen, LICH_HEN_STATUS.NoShow)}>Không đến</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleAppointments.length === 0 ? <p className="empty-state">Chưa có lịch hẹn trong ngày đã chọn.</p> : null}
      </div>
    </section>
  );
}

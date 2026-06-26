import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/api';
import {
  createShift,
  createStaff,
  deleteShift,
  deleteStaff,
  getInvoices,
  getShifts,
  updateShift,
  updateStaff,
  upsertInvoice
} from '../api/featureApi';
import { getAdminAppointments, getAdminStaff, getStaffAppointments } from '../api/managementApi';
import type { AuthResponseDto } from '../types/auth';
import type { LichHenDto } from '../types/booking';
import type { CaLamViecDto, HoaDonDto, UpsertCaLamViecDto, UpsertHoaDonDto } from '../types/features';
import type { StaffDto, StaffUpsertDto } from '../types/management';

interface OperationsPageProps {
  session: AuthResponseDto | null;
}

const emptyStaff: StaffUpsertDto = {
  maNhanVien: '',
  hoVaTen: '',
  email: '',
  soDienThoai: '',
  chuyenMon: '',
  namKinhNghiem: 0,
  diemDanhGia: 5,
  sanSangLamViec: true
};

const emptyShift: UpsertCaLamViecDto = {
  maNhanVien: '',
  ngayLam: '',
  gioBatDau: '08:00',
  gioKetThuc: '17:00',
  trangThai: 'Available',
  ghiChu: ''
};

const emptyInvoice: UpsertHoaDonDto = {
  maLichHen: 0,
  tongTien: 0,
  phuongThucThanhToan: 'Cash',
  trangThaiThanhToan: 'Unpaid'
};

export function OperationsPage({ session }: OperationsPageProps) {
  const [shifts, setShifts] = useState<CaLamViecDto[]>([]);
  const [invoices, setInvoices] = useState<HoaDonDto[]>([]);
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [appointments, setAppointments] = useState<LichHenDto[]>([]);
  const [staffForm, setStaffForm] = useState<StaffUpsertDto>(emptyStaff);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState<UpsertCaLamViecDto>(emptyShift);
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<UpsertHoaDonDto>(emptyInvoice);
  const [message, setMessage] = useState<string>('');

  const isAdmin = session?.user.vaiTro === 'Admin';
  const canAccess = session?.user.vaiTro === 'Admin' || session?.user.vaiTro === 'Staff';

  useEffect(() => {
    if (canAccess) {
      void refresh();
    }
  }, [canAccess, session]);

  async function refresh(): Promise<void> {
    const [shiftData, invoiceData, staffData, appointmentData] = await Promise.all([
      getShifts(isAdmin ? undefined : session?.user.maNguoiDung),
      getInvoices(),
      isAdmin ? getAdminStaff() : Promise.resolve([]),
      isAdmin ? getAdminAppointments() : session ? getStaffAppointments(session.user.maNguoiDung) : Promise.resolve([])
    ]);
    setShifts(shiftData);
    setInvoices(invoiceData);
    setStaff(staffData);
    setAppointments(appointmentData);
  }

  async function handleStaffSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      if (editingStaffId) {
        await updateStaff(editingStaffId, staffForm);
      } else {
        await createStaff(staffForm);
      }
      setStaffForm(emptyStaff);
      setEditingStaffId(null);
      setMessage(editingStaffId ? 'Đã cập nhật nhân viên.' : 'Đã thêm nhân viên.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleShiftSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      if (editingShiftId) {
        await updateShift(editingShiftId, shiftForm);
      } else {
        await createShift(shiftForm);
      }
      setShiftForm(emptyShift);
      setEditingShiftId(null);
      setMessage(editingShiftId ? 'Đã cập nhật ca làm.' : 'Đã thêm ca làm.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await upsertInvoice(invoiceForm);
      setInvoiceForm(emptyInvoice);
      setMessage('Đã lưu hóa đơn.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  if (!canAccess) {
    return <section className="content-panel"><p className="empty-state">Chỉ Admin hoặc nhân viên mới truy cập được màn hình vận hành.</p></section>;
  }

  return (
    <div className="page-grid">
      <section className="content-panel">
        <div className="section-head"><div><p className="eyebrow">Ca làm</p><h2>Lịch làm việc</h2></div></div>
        <div className="stack-list">
          {shifts.map((shift) => (
            <article className="list-card" key={shift.maCaLam}>
              <div><strong>{shift.tenNhanVien ?? shift.maNhanVien}</strong><p>{shift.ngayLam} | {shift.gioBatDau} - {shift.gioKetThuc}</p></div>
              <div className="row-actions">
                <span>{shift.trangThai}</span>
                {isAdmin ? <button className="ghost-button" type="button" onClick={() => {
                  setEditingShiftId(shift.maCaLam);
                  setShiftForm({
                    maNhanVien: shift.maNhanVien,
                    ngayLam: shift.ngayLam,
                    gioBatDau: shift.gioBatDau,
                    gioKetThuc: shift.gioKetThuc,
                    trangThai: shift.trangThai,
                    ghiChu: shift.ghiChu ?? ''
                  });
                }}>Sửa</button> : null}
                {isAdmin ? <button className="ghost-button" type="button" onClick={() => void deleteShift(shift.maCaLam).then(refresh)}>Xóa</button> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {isAdmin ? (
        <section className="content-panel">
          <div className="section-head"><div><p className="eyebrow">Thêm ca</p><h2>Phân ca nhân viên</h2></div></div>
          <form className="form-grid" onSubmit={handleShiftSubmit}>
            <label>Nhân viên<select value={shiftForm.maNhanVien} onChange={(event) => setShiftForm((current) => ({ ...current, maNhanVien: event.target.value }))}>
              <option value="">Chọn nhân viên</option>
              {staff.map((item) => <option key={item.maNhanVien} value={item.maNhanVien}>{item.hoVaTen}</option>)}
            </select></label>
            <label>Ngày làm<input type="date" value={shiftForm.ngayLam} onChange={(event) => setShiftForm((current) => ({ ...current, ngayLam: event.target.value }))} /></label>
            <label>Giờ bắt đầu<input type="time" value={shiftForm.gioBatDau} onChange={(event) => setShiftForm((current) => ({ ...current, gioBatDau: event.target.value }))} /></label>
            <label>Giờ kết thúc<input type="time" value={shiftForm.gioKetThuc} onChange={(event) => setShiftForm((current) => ({ ...current, gioKetThuc: event.target.value }))} /></label>
            <button className="primary-button" type="submit">{editingShiftId ? 'Cập nhật ca làm' : 'Lưu ca làm'}</button>
            {editingShiftId ? <button className="ghost-button" type="button" onClick={() => {
              setEditingShiftId(null);
              setShiftForm(emptyShift);
            }}>Hủy sửa</button> : null}
          </form>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="content-panel">
          <div className="section-head"><div><p className="eyebrow">Nhân viên</p><h2>Thêm hồ sơ nhân viên</h2></div></div>
          <form className="form-grid" onSubmit={handleStaffSubmit}>
            <label>Họ tên<input value={staffForm.hoVaTen} onChange={(event) => setStaffForm((current) => ({ ...current, hoVaTen: event.target.value }))} /></label>
            <label>Email<input type="email" value={staffForm.email} onChange={(event) => setStaffForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Số điện thoại<input value={staffForm.soDienThoai ?? ''} onChange={(event) => setStaffForm((current) => ({ ...current, soDienThoai: event.target.value }))} /></label>
            <label>Chuyên môn<input value={staffForm.chuyenMon} onChange={(event) => setStaffForm((current) => ({ ...current, chuyenMon: event.target.value }))} /></label>
            <label>Năm kinh nghiệm<input type="number" min="0" value={staffForm.namKinhNghiem} onChange={(event) => setStaffForm((current) => ({ ...current, namKinhNghiem: Number(event.target.value) }))} /></label>
            <label>Điểm đánh giá<input type="number" min="0" max="5" step="0.1" value={staffForm.diemDanhGia} onChange={(event) => setStaffForm((current) => ({ ...current, diemDanhGia: Number(event.target.value) }))} /></label>
            <label className="check-row"><input checked={staffForm.sanSangLamViec} type="checkbox" onChange={(event) => setStaffForm((current) => ({ ...current, sanSangLamViec: event.target.checked }))} /> Sẵn sàng làm việc</label>
            <button className="primary-button" type="submit">{editingStaffId ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}</button>
            {editingStaffId ? <button className="ghost-button" type="button" onClick={() => {
              setEditingStaffId(null);
              setStaffForm(emptyStaff);
            }}>Hủy sửa</button> : null}
          </form>
          <div className="stack-list space-top">
            {staff.map((item) => (
              <article className="list-card" key={item.maNhanVien}>
                <strong>{item.hoVaTen}</strong>
                <div className="row-actions">
                  <button className="ghost-button" type="button" onClick={() => {
                    setEditingStaffId(item.maNhanVien);
                    setStaffForm({
                      maNhanVien: item.maNhanVien,
                      hoVaTen: item.hoVaTen,
                      email: item.email,
                      soDienThoai: item.soDienThoai ?? '',
                      chuyenMon: item.chuyenMon ?? '',
                      namKinhNghiem: item.namKinhNghiem ?? 0,
                      diemDanhGia: item.diemDanhGia ?? 0,
                      sanSangLamViec: item.sanSangLamViec
                    });
                  }}>Sửa</button>
                  <button className="ghost-button" type="button" onClick={() => void deleteStaff(item.maNhanVien).then(refresh)}>Khóa</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="section-head"><div><p className="eyebrow">Hóa đơn</p><h2>Xác nhận thanh toán</h2></div></div>
        <form className="form-grid" onSubmit={handleInvoiceSubmit}>
          <label>Lịch hẹn<select value={invoiceForm.maLichHen} onChange={(event) => {
            const maLichHen = Number(event.target.value);
            const booking = appointments.find((item) => item.maLichHen === maLichHen);
            setInvoiceForm((current) => ({ ...current, maLichHen, tongTien: booking?.tongTien ?? 0 }));
          }}>
            <option value={0}>Chọn lịch</option>
            {appointments.map((item) => <option key={item.maLichHen} value={item.maLichHen}>{item.tenKhachHang} - {item.tenDichVu}</option>)}
          </select></label>
          <label>Tổng tiền<input type="number" min="0" value={invoiceForm.tongTien} onChange={(event) => setInvoiceForm((current) => ({ ...current, tongTien: Number(event.target.value) }))} /></label>
          <label>Phương thức thanh toán<select value={invoiceForm.phuongThucThanhToan} onChange={(event) => setInvoiceForm((current) => ({ ...current, phuongThucThanhToan: event.target.value }))}>
            <option value="Cash">Tiền mặt</option>
            <option value="BankTransfer">Chuyển khoản ngân hàng</option>
          </select></label>
          <label>Trạng thái<select value={invoiceForm.trangThaiThanhToan} onChange={(event) => setInvoiceForm((current) => ({ ...current, trangThaiThanhToan: event.target.value }))}>
            <option value="Unpaid">Chưa thanh toán</option>
            <option value="Paid">Đã thanh toán</option>
          </select></label>
          <button className="primary-button" type="submit">Lưu hóa đơn</button>
        </form>
        <div className="stack-list space-top">
          {invoices.map((invoice) => (
            <article className="list-card" key={invoice.maHoaDon}>
              <strong>#{invoice.maHoaDon} - {invoice.tenKhachHang}</strong>
              <span>{new Intl.NumberFormat('vi-VN').format(invoice.tongTien)} VND</span>
            </article>
          ))}
        </div>
      </section>

      {message ? <p className="feedback-line">{message}</p> : null}
    </div>
  );
}

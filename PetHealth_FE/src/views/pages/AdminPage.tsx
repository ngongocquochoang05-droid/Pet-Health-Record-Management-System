import { FormEvent, useEffect, useState } from 'react';
import { StatusPill } from '../components/StatusPill';
import { getApiErrorMessage } from '../../controllers/api';
import {
  createAdminService,
  deleteAdminService,
  downloadAdminReportCsv,
  getAdminAppointments,
  getAdminReports,
  getAdminServices,
  getAdminStaff,
  getAdminUsers,
  updateAdminAppointmentStatus,
  assignAdminAppointmentStaff,
  updateAdminService,
  updateUserRole
} from '../../controllers/managementApi';
import type { AuthResponseDto } from '../../models/auth';
import { LICH_HEN_STATUS, type LichHenDto, type LichHenStatus } from '../../models/booking';
import type { ReportSummaryDto, ServiceUpsertDto, StaffDto, UpdateUserRoleDto } from '../../models/management';
import type { DichVuDto } from '../../models/service';
import type { NguoiDungDto } from '../../models/user';

interface AdminPageProps {
  session: AuthResponseDto | null;
  services: DichVuDto[];
  onServicesChanged: () => Promise<void>;
}

const emptyService: ServiceUpsertDto = {
  tenDichVu: '',
  moTa: '',
  giaTien: 0,
  thoiGianThucHien: 30,
  anhDichVuUrl: '',
  loaiThuCung: '',
  trangThaiHoatDong: true
};

export function AdminPage({ session, onServicesChanged }: AdminPageProps) {
  const [appointments, setAppointments] = useState<LichHenDto[]>([]);
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [users, setUsers] = useState<NguoiDungDto[]>([]);
  const [allServices, setAllServices] = useState<DichVuDto[]>([]);
  const [report, setReport] = useState<ReportSummaryDto | null>(null);
  const [form, setForm] = useState<ServiceUpsertDto>(emptyService);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (session?.user.vaiTro !== 'Admin') {
      return;
    }

    void refresh();
  }, [session]);

  async function refresh(): Promise<void> {
    const [appointmentData, staffData, reportData, serviceData, userData] = await Promise.all([
      getAdminAppointments(),
      getAdminStaff(),
      getAdminReports(),
      getAdminServices(),
      getAdminUsers()
    ]);
    setAppointments(appointmentData);
    setStaff(staffData);
    setReport(reportData);
    setAllServices(serviceData);
    setUsers(userData);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      if (editingId) {
        await updateAdminService(editingId, form);
      } else {
        await createAdminService(form);
      }
      setForm(emptyService);
      setEditingId(null);
      setMessage('Đã lưu dịch vụ.');
      await Promise.all([onServicesChanged(), refresh()]);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleStatus(maLichHen: number, trangThai: LichHenStatus): Promise<void> {
    await updateAdminAppointmentStatus(maLichHen, { trangThai });
    await refresh();
  }

  async function handleRole(user: NguoiDungDto, payload: Partial<UpdateUserRoleDto>): Promise<void> {
    await updateUserRole(user.maNguoiDung, {
      vaiTro: (payload.vaiTro ?? user.vaiTro) as UpdateUserRoleDto['vaiTro'],
      trangThaiHoatDong: payload.trangThaiHoatDong ?? user.trangThaiHoatDong
    });
    await refresh();
  }

  async function handleDownloadCsv(): Promise<void> {
    const blob = await downloadAdminReportCsv();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pethealth-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (session?.user.vaiTro !== 'Admin') {
    return <section className="content-panel"><p className="empty-state">Chỉ tài khoản Admin mới truy cập được màn hình này.</p></section>;
  }

  return (
    <div className="page-grid">
      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Quản lý dịch vụ</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Tên dịch vụ<input value={form.tenDichVu} onChange={(event) => setForm((current) => ({ ...current, tenDichVu: event.target.value }))} /></label>
          <label>Giá tiền<input min="0" type="number" value={form.giaTien} onChange={(event) => setForm((current) => ({ ...current, giaTien: Number(event.target.value) }))} /></label>
          <label>Thời lượng phút<input min="1" type="number" value={form.thoiGianThucHien} onChange={(event) => setForm((current) => ({ ...current, thoiGianThucHien: Number(event.target.value) }))} /></label>
          <label>Loại thú cưng<input placeholder="Chó, mèo, tất cả..." value={form.loaiThuCung ?? ''} onChange={(event) => setForm((current) => ({ ...current, loaiThuCung: event.target.value }))} /></label>
          <label className="full-span">Ảnh dịch vụ<input value={form.anhDichVuUrl ?? ''} onChange={(event) => setForm((current) => ({ ...current, anhDichVuUrl: event.target.value }))} /></label>
          <label className="full-span">Mô tả<textarea rows={3} value={form.moTa ?? ''} onChange={(event) => setForm((current) => ({ ...current, moTa: event.target.value }))} /></label>
          <label className="check-row"><input checked={form.trangThaiHoatDong} onChange={(event) => setForm((current) => ({ ...current, trangThaiHoatDong: event.target.checked }))} type="checkbox" /> Đang bật dịch vụ</label>
          <button className="primary-button" type="submit">{editingId ? 'Cập nhật' : 'Thêm dịch vụ'}</button>
        </form>
        {message ? <p className="feedback-line">{message}</p> : null}
        <div className="stack-list space-top">
          {allServices.map((service) => (
            <article className="list-card" key={service.maDichVu}>
              <div>
                <strong>{service.tenDichVu}</strong>
                <p>{new Intl.NumberFormat('vi-VN').format(service.giaTien)} VND | {service.thoiGianThucHien} phút | {service.trangThaiHoatDong ? 'Đang bật' : 'Tạm tắt'}</p>
              </div>
              <div className="row-actions">
                <button className="ghost-button" type="button" onClick={() => {
                  setEditingId(service.maDichVu);
                  setForm({
                    tenDichVu: service.tenDichVu,
                    moTa: service.moTa,
                    giaTien: service.giaTien,
                    thoiGianThucHien: service.thoiGianThucHien,
                    anhDichVuUrl: service.anhDichVuUrl,
                    loaiThuCung: service.loaiThuCung,
                    trangThaiHoatDong: service.trangThaiHoatDong
                  });
                }}>Sửa</button>
                <button className="ghost-button" type="button" onClick={() => void deleteAdminService(service.maDichVu).then(refresh).then(onServicesChanged).catch((error) => setMessage(getApiErrorMessage(error)))}>
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head"><div><p className="eyebrow">Phân quyền</p><h2>Tài khoản hệ thống</h2></div></div>
        <div className="stack-list">
          {users.map((user) => (
            <article className="list-card" key={user.maNguoiDung}>
              <div>
                <strong>{user.hoVaTen}</strong>
                <p>{user.email}</p>
              </div>
              <div className="row-actions">
                <select value={user.vaiTro} onChange={(event) => void handleRole(user, { vaiTro: event.target.value as UpdateUserRoleDto['vaiTro'] })}>
                  <option value="Customer">Customer</option>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
                <button className="ghost-button" type="button" onClick={() => void handleRole(user, { trangThaiHoatDong: !user.trangThaiHoatDong })}>
                  {user.trangThaiHoatDong ? 'Khóa' : 'Mở'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head"><div><p className="eyebrow">Lịch hẹn</p><h2>Điều phối trạng thái</h2></div></div>
        <div className="table-shell">
          <table>
            <thead><tr><th>Khách</th><th>Thú cưng</th><th>Dịch vụ</th><th>Nhân viên</th><th>Ngày giờ</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {appointments.map((item) => (
                <tr key={item.maLichHen}>
                  <td>{item.tenKhachHang}</td>
                  <td>{item.tenThuCung}</td>
                  <td>{item.tenDichVu}</td>
                  <td>{item.tenNhanVien ?? 'Chưa gán'}</td>
                  <td>{item.ngayHen} {item.gioHen}</td>
                  <td><StatusPill status={item.trangThai} /></td>
                  <td>
                    <div className="row-actions"><select value={item.trangThai} onChange={(event) => void handleStatus(item.maLichHen, event.target.value as LichHenStatus)}>
                      <option value={LICH_HEN_STATUS.Pending}>Chờ xác nhận</option>
                      <option value={LICH_HEN_STATUS.Confirmed}>Đã xác nhận</option>
                      <option value={LICH_HEN_STATUS.Cancelled}>Đã hủy</option>
                      <option value={LICH_HEN_STATUS.Completed}>Hoàn thành</option>
                      <option value={LICH_HEN_STATUS.NoShow}>Không đến</option>
                    </select><select value={item.maNhanVien ?? ''} onChange={(event) => void assignAdminAppointmentStaff(item.maLichHen, event.target.value).then(refresh)}>
                      <option value="">Chọn nhân viên</option>{staff.map((member) => <option key={member.maNhanVien} value={member.maNhanVien}>{member.hoVaTen}</option>)}
                    </select></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div><p className="eyebrow">Thống kê</p><h2>Báo cáo vận hành</h2></div>
          <div className="row-actions">
            <button className="ghost-button" type="button" onClick={() => void handleDownloadCsv()}>CSV</button>
            <button className="ghost-button" type="button" onClick={() => window.print()}>PDF</button>
          </div>
        </div>
        <div className="booking-summary">
          <div><span>Doanh thu đã thu</span><strong>{new Intl.NumberFormat('vi-VN').format(report?.tongDoanhThu ?? 0)} VND</strong></div>
          <div><span>Tổng khách hàng</span><strong>{report?.tongKhachHang ?? 0}</strong></div>
          <div><span>Khách mới tháng này</span><strong>{report?.khachHangMoiThangNay ?? 0}</strong></div>
        </div>
        <div className="stack-list">
          {report?.topDichVu.map((item) => (
            <article className="list-card" key={item.maDichVu}>
              <strong>{item.tenDichVu}</strong>
              <span>{item.soLanDat} lịch</span>
            </article>
          ))}
        </div>
        <div className="stack-list space-top">
          {report?.hieuSuatNhanVien.map((item) => <article className="list-card" key={item.maNhanVien}><div><strong>{item.hoVaTen}</strong><p>{item.soLichHoanThanh}/{item.soLichDuocGiao} lịch hoàn thành</p></div><span>{new Intl.NumberFormat('vi-VN').format(item.doanhThu)} VND</span></article>)}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-head"><div><p className="eyebrow">Nhân viên</p><h2>Hồ sơ làm việc</h2></div></div>
        <div className="stack-list">
          {staff.map((item) => (
            <article className="list-card" key={item.maNhanVien}>
              <div><strong>{item.hoVaTen}</strong><p>{item.chuyenMon} | {item.namKinhNghiem ?? 0} năm</p></div>
              <span>{item.sanSangLamViec ? 'Sẵn sàng' : 'Tạm nghỉ'}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

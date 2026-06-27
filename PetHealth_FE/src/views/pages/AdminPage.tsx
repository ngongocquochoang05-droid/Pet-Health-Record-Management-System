import { FormEvent, useEffect, useState } from 'react';
import { StatusPill } from '../components/StatusPill';
import { getApiErrorMessage } from '../api/api';
import {
  createAdminService,
  deleteAdminService,
  getAdminAppointments,
  getAdminServices,
  getAdminStaff,
  getAdminUsers,
  updateAdminAppointmentStatus,
  assignAdminAppointmentStaff,
  updateAdminService,
  updateUserRole,
  uploadAdminServiceImage
} from '../api/managementApi';
import type { AuthResponseDto } from '../types/auth';
import { LICH_HEN_STATUS, type LichHenDto, type LichHenStatus } from '../types/booking';
import type { ServiceUpsertDto, StaffDto, UpdateUserRoleDto } from '../types/management';
import type { DichVuDto } from '../types/service';
import type { NguoiDungDto } from '../types/user';

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
  const [form, setForm] = useState<ServiceUpsertDto>(emptyService);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (session?.user.vaiTro !== 'Admin') {
      return;
    }

    void refresh();
  }, [session]);

  async function refresh(): Promise<void> {
    const [appointmentData, staffData, serviceData, userData] = await Promise.all([
      getAdminAppointments(),
      getAdminStaff(),
      getAdminServices(),
      getAdminUsers()
    ]);
    setAppointments(appointmentData);
    setStaff(staffData);
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

  async function handleServiceImageChange(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setMessage('');

    try {
      const imageUrl = await uploadAdminServiceImage(file);
      setForm((current) => ({ ...current, anhDichVuUrl: imageUrl }));
      setMessage('Đã tải ảnh dịch vụ.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setUploadingImage(false);
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
          <label className="full-span">
            Ảnh dịch vụ
            <input
              accept="image/jpeg,image/png,image/webp"
              disabled={uploadingImage}
              onChange={(event) => void handleServiceImageChange(event.target.files?.[0])}
              type="file"
            />
          </label>
          {form.anhDichVuUrl ? (
            <div className="full-span service-image-preview">
              <img alt="Ảnh dịch vụ đã tải lên" src={form.anhDichVuUrl} />
              <span>{uploadingImage ? 'Đang tải ảnh...' : 'Ảnh đã sẵn sàng để lưu cùng dịch vụ.'}</span>
            </div>
          ) : null}
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

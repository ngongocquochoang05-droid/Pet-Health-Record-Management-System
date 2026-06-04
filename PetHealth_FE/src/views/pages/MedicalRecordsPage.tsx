import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../controllers/api';
import { getMedicalRecords, saveMedicalRecord } from '../../controllers/clinicalApi';
import { getVisitImages } from '../../controllers/featureApi';
import { getAdminAppointments, getStaffAppointments } from '../../controllers/managementApi';
import type { AuthResponseDto } from '../../models/auth';
import type { LichHenDto } from '../../models/booking';
import type { MedicalRecordDto, UpsertMedicalRecordDto } from '../../models/clinical';
import type { PetVisitImageDto } from '../../models/features';

interface MedicalRecordsPageProps {
  session: AuthResponseDto | null;
  bookings: LichHenDto[];
}

const emptyForm: UpsertMedicalRecordDto = {
  maLichHen: 0, maThuCung: 0, chanDoan: '', dieuTri: '', thuoc: '', tiemChung: '', ghiChu: ''
};

export function MedicalRecordsPage({ session, bookings }: MedicalRecordsPageProps) {
  const [records, setRecords] = useState<MedicalRecordDto[]>([]);
  const [images, setImages] = useState<PetVisitImageDto[]>([]);
  const [form, setForm] = useState<UpsertMedicalRecordDto>(emptyForm);
  const [message, setMessage] = useState('');
  const [editableBookings, setEditableBookings] = useState<LichHenDto[]>(bookings);
  const canEdit = session?.user.vaiTro === 'Admin' || session?.user.vaiTro === 'Staff';

  useEffect(() => {
    if (session) void refresh();
  }, [session]);

  async function refresh(): Promise<void> {
    const bookingData = session?.user.vaiTro === 'Admin'
      ? await getAdminAppointments()
      : session?.user.vaiTro === 'Staff'
        ? await getStaffAppointments(session.user.maNguoiDung)
        : bookings;
    const [recordData, imageData] = await Promise.all([getMedicalRecords(), getVisitImages({})]);
    setRecords(recordData);
    setImages(imageData);
    setEditableBookings(bookingData);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await saveMedicalRecord(form);
      setForm(emptyForm);
      setMessage('Đã lưu hồ sơ bệnh án.');
      await refresh();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  if (!session) return <section className="content-panel"><p className="empty-state">Đăng nhập để xem hồ sơ bệnh án.</p></section>;

  return (
    <div className="page-grid">
      {canEdit ? (
        <section className="content-panel">
          <div className="section-head"><div><p className="eyebrow">Khám và điều trị</p><h2>Cập nhật hồ sơ bệnh án</h2></div></div>
          <form className="form-grid" onSubmit={submit}>
            <label>Lịch hẹn<select required value={form.maLichHen} onChange={(event) => {
              const maLichHen = Number(event.target.value);
              const booking = editableBookings.find((item) => item.maLichHen === maLichHen);
              setForm((current) => ({ ...current, maLichHen, maThuCung: booking?.maThuCung ?? 0 }));
            }}>
              <option value={0}>Chọn lịch hẹn</option>
              {editableBookings.map((item) => <option key={item.maLichHen} value={item.maLichHen}>{item.tenThuCung} - {item.ngayHen}</option>)}
            </select></label>
            <label>Chẩn đoán<textarea required rows={3} value={form.chanDoan} onChange={(e) => setForm((c) => ({ ...c, chanDoan: e.target.value }))} /></label>
            <label>Điều trị<textarea rows={3} value={form.dieuTri ?? ''} onChange={(e) => setForm((c) => ({ ...c, dieuTri: e.target.value }))} /></label>
            <label>Thuốc<textarea rows={3} value={form.thuoc ?? ''} onChange={(e) => setForm((c) => ({ ...c, thuoc: e.target.value }))} /></label>
            <label>Tiêm chủng<textarea rows={3} value={form.tiemChung ?? ''} onChange={(e) => setForm((c) => ({ ...c, tiemChung: e.target.value }))} /></label>
            <label className="full-span">Ghi chú<textarea rows={3} value={form.ghiChu ?? ''} onChange={(e) => setForm((c) => ({ ...c, ghiChu: e.target.value }))} /></label>
            <button className="primary-button" disabled={!form.maLichHen} type="submit">Lưu hồ sơ</button>
          </form>
        </section>
      ) : null}

      <section className={canEdit ? 'content-panel' : 'content-panel full-width'}>
        <div className="section-head"><div><p className="eyebrow">Lịch sử sức khỏe</p><h2>Hồ sơ bệnh án thú cưng</h2></div></div>
        <div className="stack-list">
          {records.map((record) => (
            <article className="list-card" key={record.maHoSo}>
              <div><strong>{record.tenThuCung} - {record.chanDoan}</strong><p>Điều trị: {record.dieuTri || 'Không có'} | Thuốc: {record.thuoc || 'Không có'}</p><p>Tiêm chủng: {record.tiemChung || 'Không có'} | {record.ngayCapNhat}</p></div>
              <span>{record.tenNhanVien}</span>
            </article>
          ))}
          {!records.length ? <p className="empty-state">Chưa có hồ sơ bệnh án.</p> : null}
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head"><div><p className="eyebrow">Ảnh hồ sơ</p><h2>Ảnh trước và sau dịch vụ</h2></div></div>
        <div className="services-grid">
          {images.map((image) => <article className="service-card" key={image.maAnh}><img className="service-card__image" src={image.anhUrl} alt={image.loaiAnh} /><strong>{image.loaiAnh}</strong><p>{image.ghiChu}</p></article>)}
          {!images.length ? <p className="empty-state">Chưa có ảnh dịch vụ.</p> : null}
        </div>
      </section>
      {message ? <p className="feedback-line">{message}</p> : null}
    </div>
  );
}

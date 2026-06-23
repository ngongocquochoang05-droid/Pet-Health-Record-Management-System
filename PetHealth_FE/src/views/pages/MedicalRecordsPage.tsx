import { FormEvent, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/api';
import { getMedicalRecords, saveMedicalRecord } from '../api/clinicalApi';
import { getVisitImages } from '../api/featureApi';
import { getAdminAppointments, getStaffAppointments } from '../api/managementApi';
import type { AuthResponseDto } from '../types/auth';
import type { LichHenDto } from '../types/booking';
import type { MedicalRecordDto, UpsertMedicalRecordDto } from '../types/clinical';
import type { PetVisitImageDto } from '../types/features';

interface MedicalRecordsPageProps {
  session: AuthResponseDto | null;
  bookings: LichHenDto[];
}

const emptyForm: UpsertMedicalRecordDto = {
  maLichHen: 0,
  maThuCung: 0,
  chanDoan: '',
  dieuTri: '',
  thuoc: '',
  tiemChung: '',
  ghiChu: ''
};

export function MedicalRecordsPage({ session, bookings }: MedicalRecordsPageProps) {
  const [records, setRecords] = useState<MedicalRecordDto[]>([]);
  const [images, setImages] = useState<PetVisitImageDto[]>([]);
  const [form, setForm] = useState<UpsertMedicalRecordDto>(emptyForm);
  const [message, setMessage] = useState('');
  const [editableBookings, setEditableBookings] = useState<LichHenDto[]>(bookings);

  const canEdit = session?.user.vaiTro === 'Staff';
  const canViewServiceImages = session?.user.vaiTro === 'Staff' || session?.user.vaiTro === 'Customer';

  useEffect(() => {
    if (session) void refresh();
  }, [session]);

  async function refresh(): Promise<void> {
    const bookingData = session?.user.vaiTro === 'Admin'
      ? await getAdminAppointments()
      : session?.user.vaiTro === 'Staff'
        ? await getStaffAppointments(session.user.maNguoiDung)
        : bookings;

    const [recordData, imageData] = await Promise.all([
      getMedicalRecords(),
      canViewServiceImages ? getVisitImages({}) : Promise.resolve([])
    ]);

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

  if (!session) {
    return (
      <section className="content-panel">
        <p className="empty-state">Đăng nhập để xem hồ sơ bệnh án.</p>
      </section>
    );
  }

  return (
    <div className="page-grid">
      {canEdit ? (
        <section className="content-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Khám và điều trị</p>
              <h2>Cập nhật hồ sơ bệnh án</h2>
            </div>
          </div>
          <form className="form-grid medical-record-form" onSubmit={submit}>
            <label>
              Lịch hẹn
              <select required value={form.maLichHen} onChange={(event) => {
                const maLichHen = Number(event.target.value);
                const booking = editableBookings.find((item) => item.maLichHen === maLichHen);
                setForm((current) => ({ ...current, maLichHen, maThuCung: booking?.maThuCung ?? 0 }));
              }}>
                <option value={0}>Chọn lịch hẹn</option>
                {editableBookings.map((item) => (
                  <option key={item.maLichHen} value={item.maLichHen}>
                    {item.tenThuCung} - {item.ngayHen}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chẩn đoán
              <textarea required rows={3} value={form.chanDoan} onChange={(event) => setForm((current) => ({ ...current, chanDoan: event.target.value }))} />
            </label>
            <label>
              Điều trị
              <textarea rows={3} value={form.dieuTri ?? ''} onChange={(event) => setForm((current) => ({ ...current, dieuTri: event.target.value }))} />
            </label>
            <label>
              Thuốc
              <textarea rows={3} value={form.thuoc ?? ''} onChange={(event) => setForm((current) => ({ ...current, thuoc: event.target.value }))} />
            </label>
            <label>
              Tiêm chủng
              <textarea rows={3} value={form.tiemChung ?? ''} onChange={(event) => setForm((current) => ({ ...current, tiemChung: event.target.value }))} />
            </label>
            <label className="full-span">
              Ghi chú
              <textarea rows={3} value={form.ghiChu ?? ''} onChange={(event) => setForm((current) => ({ ...current, ghiChu: event.target.value }))} />
            </label>
            <button className="primary-button" disabled={!form.maLichHen} type="submit">Lưu hồ sơ</button>
          </form>
        </section>
      ) : null}

      <section className={canEdit ? 'content-panel' : 'content-panel full-width'}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Lịch sử sức khỏe</p>
            <h2>Hồ sơ bệnh án thú cưng</h2>
          </div>
        </div>
        <div className="stack-list">
          {records.map((record) => (
            <article className="list-card" key={record.maHoSo}>
              <div>
                <strong>{record.tenThuCung} - {record.chanDoan}</strong>
                <p>Điều trị: {record.dieuTri || 'Không có'} | Thuốc: {record.thuoc || 'Không có'}</p>
                <p>Tiêm chủng: {record.tiemChung || 'Không có'} | {record.ngayCapNhat}</p>
              </div>
              <span>{record.tenNhanVien}</span>
            </article>
          ))}
          {!records.length ? <p className="empty-state">Chưa có hồ sơ bệnh án.</p> : null}
        </div>
      </section>

      {canViewServiceImages ? (
        <section className="content-panel full-width">
          <div className="section-head">
            <div>
              <p className="eyebrow">Ảnh hồ sơ</p>
              <h2>Ảnh trước và sau dịch vụ</h2>
            </div>
          </div>
          <div className="services-grid visit-image-grid">
            {images.map((image) => (
              <article className="service-card visit-image-card" key={image.maAnh}>
                <div className="visit-image-frame">
                  <img src={image.anhUrl} alt={`${image.tenThuCung} - ${image.loaiAnh}`} />
                </div>
                <div className="visit-image-meta">
                  <span className="status-badge">{image.loaiAnh === 'After' ? 'Sau dịch vụ' : 'Trước dịch vụ'}</span>
                  <strong>{image.tenThuCung || `Thú cưng #${image.maThuCung}`}</strong>
                  <p>{image.tenDichVu || 'Chưa rõ dịch vụ'}</p>
                  <small>Lịch #{image.maLichHen}{image.ngayHen ? ` - ${image.ngayHen}${image.gioHen ? ` lúc ${image.gioHen}` : ''}` : ''}</small>
                  {image.ghiChu ? <p>{image.ghiChu}</p> : null}
                </div>
              </article>
            ))}
            {!images.length ? <p className="empty-state">Chưa có ảnh dịch vụ.</p> : null}
          </div>
        </section>
      ) : null}

      {message ? <p className="feedback-line">{message}</p> : null}
    </div>
  );
}

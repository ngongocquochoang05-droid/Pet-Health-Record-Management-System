import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getApiErrorMessage } from '../api/api';
import { deleteVisitImage, getPetHistory, getVisitImages, uploadVisitImage } from '../api/featureApi';
import { getStaffAppointments } from '../api/managementApi';
import type { AuthResponseDto } from '../types/auth';
import type { LichHenDto } from '../types/booking';
import type { PetHistoryDto, PetVisitImageDto } from '../types/features';

interface StaffWorkPageProps {
  session: AuthResponseDto | null;
}

const qrReaderId = 'staff-qr-reader';

export function StaffWorkPage({ session }: StaffWorkPageProps) {
  const [appointments, setAppointments] = useState<LichHenDto[]>([]);
  const [history, setHistory] = useState<PetHistoryDto[]>([]);
  const [images, setImages] = useState<PetVisitImageDto[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [searching, setSearching] = useState(false);
  const [imageForm, setImageForm] = useState({
    maLichHen: 0,
    maThuCung: 0,
    loaiAnh: 'Before' as 'Before' | 'After',
    ghiChu: ''
  });
  const [message, setMessage] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.maLichHen === imageForm.maLichHen),
    [appointments, imageForm.maLichHen]
  );

  useEffect(() => {
    if (session?.user.vaiTro !== 'Staff') {
      setAppointments([]);
      return;
    }

    void getStaffAppointments(session.user.maNguoiDung)
      .then((data) => {
        setAppointments(data);
        const firstUploadable = data.find((appointment) => appointment.trangThai !== 'Cancelled');
        if (firstUploadable) {
          setImageForm((current) => ({
            ...current,
            maLichHen: firstUploadable.maLichHen,
            maThuCung: firstUploadable.maThuCung
          }));
        }
      })
      .catch((error) => setMessage(getApiErrorMessage(error)));
  }, [session]);

  useEffect(() => () => {
    void stopCamera();
  }, []);

  async function searchHistory(maQr = qrCode): Promise<void> {
    if (!session?.accessToken) {
      setMessage('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại bằng tài khoản nhân viên.');
      return;
    }

    setSearching(true);
    try {
      const data = await getPetHistory({ maThuCung: imageForm.maThuCung || undefined, maQr: maQr || undefined });
      setHistory(data);
      setMessage(data.length ? 'Đã tải hồ sơ thú cưng.' : 'Không tìm thấy lịch sử chăm sóc phù hợp.');

      const lookupPetId = imageForm.maThuCung || data[0]?.maThuCung;
      if (lookupPetId) {
        setImages(await getVisitImages({ maThuCung: lookupPetId }));
        setImageForm((current) => ({ ...current, maThuCung: lookupPetId }));
      } else {
        setImages([]);
      }
    } finally {
      setSearching(false);
    }
  }

  async function handleSearchHistory(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await searchHistory();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function handleImageSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      if (!imageForm.maLichHen || !imageForm.maThuCung) {
        setMessage('Vui lòng chọn lịch hẹn cần tải ảnh.');
        return;
      }

      if (!imageFile) {
        setMessage('Vui lòng chọn file ảnh.');
        return;
      }

      await uploadVisitImage({ ...imageForm, file: imageFile });
      setImageFile(null);
      setImageForm((current) => ({ ...current, ghiChu: '' }));
      setImages(await getVisitImages({
        maThuCung: imageForm.maThuCung,
        maLichHen: imageForm.maLichHen
      }));
      setMessage('Đã tải ảnh trước hoặc sau dịch vụ.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  function handleAppointmentChange(maLichHen: number): void {
    const appointment = appointments.find((item) => item.maLichHen === maLichHen);
    setImageForm((current) => ({
      ...current,
      maLichHen,
      maThuCung: appointment?.maThuCung ?? 0
    }));
  }

  async function startCamera(): Promise<void> {
    try {
      if (!navigator.mediaDevices.getUserMedia) {
        setMessage('Trình duyệt chưa hỗ trợ camera. Bạn vẫn có thể nhập mã QR thủ công.');
        return;
      }

      await stopCamera();
      setCameraActive(true);
        setMessage('Trình duyệt chưa hỗ trợ camera. Bạn vẫn có thể nhập mã QR thủ công.');

      window.setTimeout(() => {
        const scanner = new Html5Qrcode(qrReaderId);
        qrScannerRef.current = scanner;

        void scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            const value = decodedText.trim();
            if (!value) {
              return;
            }

            setQrCode(value);
            setMessage('Đã nhận mã QR. Đang tra cứu hồ sơ...');
            void stopCamera();
            void searchHistory(value).catch((error) => setMessage(getApiErrorMessage(error)));
          },
          () => {
            // Scanner callback fires frequently while searching; keep the UI quiet.
          }
        ).catch(() => {
        setMessage('Trình duyệt chưa hỗ trợ camera. Bạn vẫn có thể nhập mã QR thủ công.');
          setCameraActive(false);
          qrScannerRef.current = null;
        });
      }, 0);
    } catch {
        setMessage('Trình duyệt chưa hỗ trợ camera. Bạn vẫn có thể nhập mã QR thủ công.');
      setCameraActive(false);
    }
  }

  async function stopCamera(): Promise<void> {
    const scanner = qrScannerRef.current;
    qrScannerRef.current = null;

    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch {
        // Ignore cleanup errors while closing the scanner.
      }
    }

    try {
      await scanner?.clear();
    } catch {
      // Ignore cleanup errors if the element was already removed.
    }

    setCameraActive(false);
  }

  if (session?.user.vaiTro !== 'Staff') {
    return (
      <section className="content-panel">
        <p className="empty-state">Chỉ nhân viên mới truy cập màn hình này.</p>
      </section>
    );
  }

  return (
    <div className="page-grid">
      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Hồ sơ thú cưng</p>
            <h2>Tra cứu bằng QR</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleSearchHistory}>
          <label className="full-span">
            Mã QR
            <input value={qrCode} onChange={(event) => setQrCode(event.target.value)} />
          </label>
          <div className="staff-qr-actions full-span">
            <button className={`secondary-button${searching ? ' is-loading' : ''}`} disabled={searching} type="submit">
              {searching ? 'Đang tra cứu...' : 'Tra cứu'}
            </button>
            <button className="ghost-button" onClick={() => void (cameraActive ? stopCamera() : startCamera())} type="button">
              {cameraActive ? 'Đóng camera' : 'Quét QR bằng camera'}
            </button>
          </div>
        </form>
        {cameraActive ? (
          <div className="staff-qr-camera">
            <div id={qrReaderId} />
            <span>Đặt mã QR vào giữa khung hình</span>
          </div>
        ) : null}
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Ảnh dịch vụ</p>
            <h2>Tải ảnh trước hoặc sau dịch vụ</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleImageSubmit}>
          <label className="full-span">
            Lịch hẹn được phân công
            <select value={imageForm.maLichHen || ''} onChange={(event) => handleAppointmentChange(Number(event.target.value))}>
              <option value="">Chọn lịch hẹn</option>
              {appointments.map((appointment) => (
                <option key={appointment.maLichHen} value={appointment.maLichHen}>
                  #{appointment.maLichHen} - {appointment.tenKhachHang} - {appointment.tenThuCung} - {appointment.ngayHen} {appointment.gioHen}
                </option>
              ))}
            </select>
          </label>
          <label>
            Thú cưng
            <input disabled value={selectedAppointment ? `${selectedAppointment.tenThuCung} (#${selectedAppointment.maThuCung})` : 'Chưa chọn lịch'} />
          </label>
          <label>
            Loại ảnh
            <select value={imageForm.loaiAnh} onChange={(event) => setImageForm((current) => ({ ...current, loaiAnh: event.target.value as 'Before' | 'After' }))}>
              <option value="Before">Trước dịch vụ</option>
              <option value="After">Sau dịch vụ</option>
            </select>
          </label>
          <label className="full-span">
            File ảnh
            <input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
          </label>
          <label className="full-span">
            Ghi chú
            <textarea rows={3} value={imageForm.ghiChu} onChange={(event) => setImageForm((current) => ({ ...current, ghiChu: event.target.value }))} />
          </label>
          <button className="primary-button" type="submit">Tải ảnh</button>
        </form>
      </section>

      {history.length ? (
        <section className="content-panel full-width">
          <div className="section-head">
            <div>
              <p className="eyebrow">Lịch sử khám</p>
              <h2>Hồ sơ chăm sóc thú cưng</h2>
            </div>
          </div>
          <div className="stack-list">
            {history.map((item) => (
              <article className="list-card" key={item.maLichHen}>
                <div>
                  <strong>{item.tenThuCung}</strong>
                  <p>{item.tenDichVu} - {item.ngayHen} {item.gioHen}</p>
                  {item.ghiChu ? <p>Ghi chú lịch hẹn: {item.ghiChu}</p> : null}
                  {item.maHoSo ? (
                    <div className="medical-summary">
                      <strong>Hồ sơ bệnh án</strong>
                      <p><b>Chẩn đoán:</b> {item.chanDoan || 'Chưa cập nhật'}</p>
                      {item.dieuTri ? <p><b>Điều trị:</b> {item.dieuTri}</p> : null}
                      {item.thuoc ? <p><b>Thuốc:</b> {item.thuoc}</p> : null}
                      {item.tiemChung ? <p><b>Tiêm chủng:</b> {item.tiemChung}</p> : null}
                      {item.ghiChuBenhAn ? <p><b>Ghi chú bệnh án:</b> {item.ghiChuBenhAn}</p> : null}
                      <p><b>Cập nhật:</b> {item.ngayCapNhatBenhAn ?? 'Chưa rõ'}{item.tenNhanVienCapNhat ? ` - ${item.tenNhanVienCapNhat}` : ''}</p>
                    </div>
                  ) : (
                    <p className="muted-text">Lịch hẹn này chưa có hồ sơ bệnh án.</p>
                  )}
                </div>
                <span>{item.trangThai}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {images.length ? (
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
                <button
                  className="ghost-button"
                  onClick={() => void deleteVisitImage(image.maAnh)
                    .then(() => setImages((current) => current.filter((item) => item.maAnh !== image.maAnh)))
                    .catch((error) => setMessage(getApiErrorMessage(error)))}
                  type="button"
                >
                  Xóa ảnh
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {message ? <p className="feedback-line full-width">{message}</p> : null}
    </div>
  );
}

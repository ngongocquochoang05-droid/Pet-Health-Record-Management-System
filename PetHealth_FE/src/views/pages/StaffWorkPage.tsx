import { FormEvent, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getApiErrorMessage } from '../../controllers/api';
import { deleteVisitImage, getPetHistory, getVisitImages, uploadVisitImage } from '../../controllers/featureApi';
import type { AuthResponseDto } from '../../models/auth';
import type { PetHistoryDto, PetVisitImageDto } from '../../models/features';

interface StaffWorkPageProps {
  session: AuthResponseDto | null;
}

const qrReaderId = 'staff-qr-reader';

export function StaffWorkPage({ session }: StaffWorkPageProps) {
  const [history, setHistory] = useState<PetHistoryDto[]>([]);
  const [images, setImages] = useState<PetVisitImageDto[]>([]);
  const [petCode, setPetCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [searching, setSearching] = useState(false);
  const [imageForm, setImageForm] = useState({
    maLichHen: 0,
    maThuCung: 0,
    loaiAnh: 'Before' as 'Before' | 'After',
    ghiChu: '',
  });
  const [message, setMessage] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

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
      const maThuCung = petCode ? Number(petCode) : undefined;
      const data = await getPetHistory({ maThuCung: maThuCung || undefined, maQr: maQr || undefined });
      setHistory(data);
      setMessage(data.length ? 'Đã tải hồ sơ thú cưng.' : 'Không tìm thấy lịch sử chăm sóc phù hợp.');
      if (maThuCung) {
        setImages(await getVisitImages({ maThuCung }));
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
      if (!imageFile) {
        setMessage('Vui lòng chọn file ảnh.');
        return;
      }

      await uploadVisitImage({ ...imageForm, file: imageFile });
      setImageFile(null);
      setImageForm((current) => ({ ...current, ghiChu: '' }));
      setImages(await getVisitImages({
        maThuCung: imageForm.maThuCung || undefined,
        maLichHen: imageForm.maLichHen || undefined,
      }));
      setMessage('Đã tải ảnh trước hoặc sau khi khám.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  }

  async function startCamera(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('Trình duyệt chưa hỗ trợ camera. Bạn vẫn có thể nhập mã QR thủ công.');
        return;
      }

      await stopCamera();
      setCameraActive(true);
      setMessage('Đưa mã QR vào giữa khung camera.');

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
            // The scanner calls this often while searching; keep the UI quiet.
          }
        ).catch(() => {
          setMessage('Không thể mở camera. Hãy cấp quyền camera hoặc nhập mã QR thủ công.');
          setCameraActive(false);
          qrScannerRef.current = null;
        });
      }, 0);
    } catch {
      setMessage('Không thể mở camera. Hãy cấp quyền camera hoặc nhập mã QR thủ công.');
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
        // Ignore camera cleanup errors while closing the scanner.
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
            <h2>Tra cứu bằng mã thú cưng hoặc QR</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleSearchHistory}>
          <label>
            Mã thú cưng
            <input inputMode="numeric" value={petCode} onChange={(event) => setPetCode(event.target.value)} />
          </label>
          <label>
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
            <p className="eyebrow">Ảnh khám</p>
            <h2>Tải ảnh trước hoặc sau dịch vụ</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleImageSubmit}>
          <label>
            Lịch hẹn
            <input type="number" value={imageForm.maLichHen} onChange={(event) => setImageForm((current) => ({ ...current, maLichHen: Number(event.target.value) }))} />
          </label>
          <label>
            Mã thú cưng
            <input type="number" value={imageForm.maThuCung} onChange={(event) => setImageForm((current) => ({ ...current, maThuCung: Number(event.target.value) }))} />
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
          <div className="services-grid">
            {images.map((image) => (
              <article className="service-card" key={image.maAnh}>
                <img className="service-card__image" src={image.anhUrl} alt={image.loaiAnh} />
                <strong>{image.loaiAnh}</strong>
                <p>{image.ghiChu}</p>
                <button className="ghost-button" type="button" onClick={() => void deleteVisitImage(image.maAnh).then(() => setImages((current) => current.filter((item) => item.maAnh !== image.maAnh))).catch((error) => setMessage(getApiErrorMessage(error)))}>Xóa ảnh</button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {message ? <p className="feedback-line full-width">{message}</p> : null}
    </div>
  );
}

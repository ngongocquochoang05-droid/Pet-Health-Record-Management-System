import { FormEvent, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getApiErrorMessage } from '../api/api';
import { getPetHistory } from '../api/featureApi';
import type { AuthResponseDto } from '../types/auth';
import type { PetHistoryDto } from '../types/features';

interface StaffWorkPageProps {
  session: AuthResponseDto | null;
}

const qrReaderId = 'staff-qr-reader';

export function StaffWorkPage({ session }: StaffWorkPageProps) {
  const [history, setHistory] = useState<PetHistoryDto[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [searching, setSearching] = useState(false);
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

    if (!maQr.trim()) {
      setMessage('Vui lòng nhập hoặc quét mã QR của thú cưng.');
      return;
    }

    setSearching(true);
    try {
      const data = await getPetHistory({ maQr: maQr.trim() });
      setHistory(data);
      setMessage(data.length ? 'Đã tải lịch sử chăm sóc thú cưng.' : 'Không tìm thấy lịch sử chăm sóc phù hợp.');
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

  async function startCamera(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('Trình duyệt chưa hỗ trợ camera. Bạn vẫn có thể nhập mã QR thủ công.');
        return;
      }

      await stopCamera();
      setCameraActive(true);

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
          setMessage('Không mở được camera. Bạn vẫn có thể nhập mã QR thủ công.');
          setCameraActive(false);
          qrScannerRef.current = null;
        });
      }, 0);
    } catch {
      setMessage('Không mở được camera. Bạn vẫn có thể nhập mã QR thủ công.');
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
      <section className="content-panel full-width">
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
                      <strong>Hồ sơ sức khỏe</strong>
                      <p><b>Chẩn đoán:</b> {item.chanDoan || 'Chưa cập nhật'}</p>
                      {item.dieuTri ? <p><b>Điều trị:</b> {item.dieuTri}</p> : null}
                      {item.thuoc ? <p><b>Thuốc:</b> {item.thuoc}</p> : null}
                      {item.tiemChung ? <p><b>Tiêm chủng:</b> {item.tiemChung}</p> : null}
                      {item.ghiChuBenhAn ? <p><b>Ghi chú bệnh án:</b> {item.ghiChuBenhAn}</p> : null}
                      <p><b>Cập nhật:</b> {item.ngayCapNhatBenhAn ?? 'Chưa rõ'}{item.tenNhanVienCapNhat ? ` - ${item.tenNhanVienCapNhat}` : ''}</p>
                    </div>
                  ) : (
                    <p className="muted-text">Lịch hẹn này chưa có hồ sơ sức khỏe.</p>
                  )}
                </div>
                <span>{item.trangThai}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {message ? <p className="feedback-line full-width">{message}</p> : null}
    </div>
  );
}

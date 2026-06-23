import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveSession } from '../api/authStorage';
import type { AuthResponseDto } from '../types/auth';

interface GoogleCallbackPageProps {
  onAuthenticated: (session: AuthResponseDto) => void;
}

export function GoogleCallbackPage({ onAuthenticated }: GoogleCallbackPageProps) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('Đang hoàn tất Đăng nhập Google...');

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      setMessage(decodeURIComponent(error));
      return;
    }

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const expiresAt = params.get('expiresAt');
    const maNguoiDung = params.get('maNguoiDung');
    const hoVaTen = params.get('hoVaTen');
    const email = params.get('email');
    const vaiTro = params.get('vaiTro');
    const trangThaiHoatDong = params.get('trangThaiHoatDong');

    if (!accessToken || !refreshToken || !expiresAt || !maNguoiDung || !hoVaTen || !email || !vaiTro) {
      setMessage('Không nhận được thông tin Đăng nhập Google.');
      return;
    }

    const session: AuthResponseDto = {
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        maNguoiDung,
        hoVaTen,
        email,
        soDienThoai: params.get('soDienThoai'),
        gioiTinh: params.get('gioiTinh'),
        diaChi: params.get('diaChi'),
        vaiTro,
        trangThaiHoatDong: trangThaiHoatDong?.toLowerCase() === 'true'
      }
    };

    saveSession(session);
    onAuthenticated(session);
    navigate('/', { replace: true });
  }, [navigate, onAuthenticated, params]);

  return (
    <section className="content-panel">
      <p className="empty-state">{message}</p>
    </section>
  );
}

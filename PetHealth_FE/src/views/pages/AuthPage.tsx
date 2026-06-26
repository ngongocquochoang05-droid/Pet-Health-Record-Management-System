import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api';
import { beginGoogleLogin, login, register } from '../api/authApi';
import { saveSession } from '../api/authStorage';
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from '../types/auth';

interface AuthPageProps {
  onAuthenticated: (session: AuthResponseDto) => void;
}

const initialLogin: LoginRequestDto = {
  email: '',
  matKhau: ''
};

const initialRegister: RegisterRequestDto = {
  hoVaTen: '',
  email: '',
  matKhau: '',
  soDienThoai: ''
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginPayload, setLoginPayload] = useState<LoginRequestDto>(initialLogin);
  const [registerPayload, setRegisterPayload] = useState<RegisterRequestDto>(initialRegister);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);

    try {
      const session = await login(loginPayload);
      saveSession(session);
      onAuthenticated(session);
      setMessage('Đăng nhập thành công.');
      navigate('/');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (registerPayload.matKhau !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);

    try {
      const emailName = registerPayload.email.split('@')[0]?.trim() || 'Khách hàng PetHealth';
      await register({
        ...registerPayload,
        hoVaTen: registerPayload.hoVaTen.trim() || emailName,
        soDienThoai: ''
      });
      setMode('login');
      setLoginPayload({ ...initialLogin, email: registerPayload.email });
      setMessage('Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`auth-screen auth-screen--${mode}`}>
      <div className="auth-bg-overlay" aria-hidden="true" />

      {mode === 'register' ? (
        <section className="auth-promo-panel" aria-label="Giới thiệu tài khoản PetHealth">
          <p className="eyebrow">Premium Pet Care</p>
          <h2>Tham gia cộng đồng <em>yêu thú cưng</em> ngay hôm nay!</h2>
          <p>
            Đăng ký miễn phí để trải nghiệm hệ thống đặt lịch chăm sóc thú cưng thông minh,
            an toàn và cá nhân hóa.
          </p>
          <div className="auth-benefits">
            <span>Đặt lịch trực tuyến 24/7</span>
            <span>Nhận thông báo xác nhận ngay</span>
            <span>Tích điểm sau mỗi lần sử dụng</span>
            <span>Quản lý hồ sơ thú cưng dễ dàng</span>
          </div>
        </section>
      ) : null}

      <section className="auth-card">
        {mode === 'login' ? (
          <>
            <div className="auth-card-head">
              <h1>Đăng nhập</h1>
              <p>Chào mừng bạn quay lại!</p>
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  placeholder="email@example.com"
                  value={loginPayload.email}
                  onChange={(event) => setLoginPayload((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                />
              </label>
              <label>
                Mật khẩu
                <input
                  placeholder="Nhập mật khẩu"
                  value={loginPayload.matKhau}
                  onChange={(event) => setLoginPayload((current) => ({ ...current, matKhau: event.target.value }))}
                  type="password"
                />
              </label>
              <button className="auth-primary-button" disabled={submitting} type="submit">
                Đăng nhập
              </button>
              <Link className="auth-inline-link" to="/auth/forgot-password">Quên mật khẩu?</Link>
              <div className="auth-divider"><span>hoặc</span></div>
              <button className="auth-google-button" disabled={submitting} onClick={beginGoogleLogin} type="button">
                <span>G</span>
                Tiếp tục với Google
              </button>
            </form>

            <p className="auth-switch">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setMessage('');
                }}
              >
                Đăng ký miễn phí
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="auth-card-head">
              <h1>Tạo tài khoản</h1>
              <p>Điền thông tin để bắt đầu</p>
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
              <label>
                Email
                <input
                  placeholder="email@example.com"
                  value={registerPayload.email}
                  onChange={(event) => setRegisterPayload((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                />
              </label>
              <label>
                Mật khẩu
                <input
                  placeholder="Tối thiểu 8 ký tự"
                  value={registerPayload.matKhau}
                  onChange={(event) => setRegisterPayload((current) => ({ ...current, matKhau: event.target.value }))}
                  minLength={6}
                  type="password"
                />
              </label>
              <label>
                Xác nhận mật khẩu
                <input
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  type="password"
                />
              </label>
              <button className="auth-primary-button" disabled={submitting} type="submit">
                Tạo tài khoản
              </button>
            </form>

            <p className="auth-switch">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage('');
                }}
              >
                Quay lại đăng nhập
              </button>
            </p>
          </>
        )}

        {message ? <p className="feedback-line">{message}</p> : null}
        <Link className="auth-home-link" to="/">Quay lại trang chủ</Link>
      </section>
    </div>
  );
}

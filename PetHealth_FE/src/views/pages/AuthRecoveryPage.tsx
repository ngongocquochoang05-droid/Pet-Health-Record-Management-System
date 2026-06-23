import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api';
import { forgotPassword, resendVerification, resetPassword, verifyEmail } from '../api/authApi';

interface AuthRecoveryPageProps {
  mode: 'forgot-password' | 'reset-password' | 'verify-email';
}

export function AuthRecoveryPage({ mode }: AuthRecoveryPageProps) {
  const [params] = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const token = params.get('token') ?? '';

  useEffect(() => {
    if (mode !== 'verify-email' || !token) {
      return;
    }

    setSubmitting(true);
    void verifyEmail({ token })
      .then(() => setMessage('Xác minh email thành công. Bạn có thể đăng nhập ngay.'))
      .catch((error) => setMessage(getApiErrorMessage(error)))
      .finally(() => setSubmitting(false));
  }, [mode, token]);

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword({ email });
      setMessage('Nếu email hợp lệ, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) {
      setMessage('Đường dẫn đặt lại mật khẩu không hợp lệ.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ token, matKhauMoi: password });
      setMessage('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendVerification(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    try {
      await resendVerification({ email });
      setMessage('Nếu email hợp lệ, hệ thống đã gửi lại đường dẫn xác minh.');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';

  return (
    <div className="auth-screen auth-screen--recovery">
      <div className="auth-bg-overlay" aria-hidden="true" />
      <section className="auth-card auth-card--compact">
        <div className="auth-card-head">
          <h1>{isForgotPassword ? 'Quên mật khẩu' : isResetPassword ? 'Đặt lại mật khẩu' : 'Xác minh email'}</h1>
          <p>
            {isForgotPassword
              ? 'Nhập email để nhận đường dẫn đặt lại mật khẩu.'
              : isResetPassword
                ? 'Tạo mật khẩu mới cho tài khoản PetHealth.'
                : token
                  ? 'Hệ thống đang xử lý đường dẫn xác minh của bạn.'
                  : 'Nhập email để nhận lại đường dẫn xác minh.'}
          </p>
        </div>

        {isForgotPassword ? (
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <label>
              Email
              <input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button className="auth-primary-button" disabled={submitting} type="submit">
              {submitting ? 'Đang gửi...' : 'Gửi hướng dẫn'}
            </button>
          </form>
        ) : null}

        {isResetPassword ? (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label>
              Mật khẩu mới
              <input autoComplete="new-password" minLength={6} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              Xác nhận mật khẩu
              <input autoComplete="new-password" minLength={6} required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
            <button className="auth-primary-button" disabled={submitting} type="submit">
              {submitting ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        ) : null}

        {mode === 'verify-email' && !token ? (
          <form className="auth-form" onSubmit={handleResendVerification}>
            <label>
              Email
              <input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button className="auth-primary-button" disabled={submitting} type="submit">
              {submitting ? 'Đang gửi...' : 'Gửi lại email xác minh'}
            </button>
          </form>
        ) : null}

        {message ? <p className="feedback-line">{message}</p> : null}
        <Link className="auth-home-link" to="/auth">Quay lại đăng nhập</Link>
      </section>
    </div>
  );
}

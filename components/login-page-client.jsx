"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminDashboard } from "@/components/home-page-client";
import { PawLogoIcon, UserIcon } from "@/components/icons";
import SiteLogo from "@/components/site-logo";

const heroImage =
  "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1800&q=80";

export default function LoginPageClient() {
  const [email, setEmail] = useState("admin@mypuppy.vn");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (email.trim().toLowerCase() === "admin@mypuppy.vn" && password.trim() === "admin123") {
      setError(false);
      setIsAdminView(true);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    setError(true);
  };

  const fillAdminDemo = () => {
    setEmail("admin@mypuppy.vn");
    setPassword("admin123");
    setError(false);
  };

  if (isAdminView) {
    return <AdminDashboard onLogout={() => setIsAdminView(false)} />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-900">
      <div className="login-background-soft absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-sky-950/40 to-slate-950/68" />

      <section className="login-card-soft hero-fade relative z-10 w-full max-w-xl rounded-[1.35rem] border border-white/55 px-8 py-10 md:px-10">
        <div className="text-center">
          <SiteLogo href="/" variant="landing" tag="Premium" className="login-logo-on-glass mb-6" />
          <h1 className="text-3xl font-extrabold text-slate-950">Đăng nhập</h1>
          <p className="mt-3 flex items-center justify-center gap-2 text-base text-slate-500">
            <span>Chào mừng bạn quay lại!</span>
            <PawLogoIcon className="h-4 w-4 text-sky-500" />
          </p>
        </div>

        <div className="mt-9">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Đăng nhập nhanh demo</p>
          <button
            type="button"
            onClick={fillAdminDemo}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-base font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
          >
            <UserIcon className="h-5 w-5" />
            <span>Admin - admin@mypuppy.vn</span>
          </button>
        </div>

        <div className="my-9 flex items-center gap-4 text-sm font-medium text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>Hoặc đăng nhập thủ công</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-base font-semibold text-slate-800">Email</span>
            <span className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition focus-within:border-white/80 focus-within:shadow-[0_14px_34px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6.5h16v11H4z" />
                <path d="m4.8 7.2 7.2 5.4 7.2-5.4" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
            </span>
          </label>
          <label className="block">
            <span className="text-base font-semibold text-slate-800">Mật khẩu</span>
            <span className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition focus-within:border-white/80 focus-within:shadow-[0_14px_34px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-sky-600"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.6" />
                </svg>
              </button>
            </span>
          </label>

          {error ? (
            <p className="text-sm font-medium text-rose-600">Thông tin đăng nhập chưa đúng. Vui lòng thử lại.</p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-400 to-sky-600 px-6 py-4 text-lg font-bold text-white shadow-[0_14px_30px_rgba(14,165,233,0.28)] transition hover:from-sky-500 hover:to-sky-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M14 5l7 7-7 7" />
              <path d="M21 12H9" />
              <path d="M5 5v14" />
            </svg>
            <span>Đăng nhập</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-sky-600">
            Quay lại Trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}

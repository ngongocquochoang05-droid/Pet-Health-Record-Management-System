"use client";

import Link from "next/link";
import SiteLogo from "@/components/site-logo";
import useRevealOnScroll from "@/components/use-reveal-on-scroll";

const heroImage =
  "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1800&q=80";

export default function SubpageLayout({
  active,
  eyebrow,
  title,
  description,
  children,
}) {
  useRevealOnScroll();

  const navItems = [
    { href: "/", label: "Trang chủ", key: "home" },
    { href: "/dich-vu", label: "Dịch vụ", key: "services" },
    { href: "/dat-lich", label: "Đặt lịch", key: "booking" },
    { href: "/phu-kien", label: "Phụ kiện", key: "accessories" },
    { href: "/danh-gia", label: "Đánh giá", key: "reviews" },
  ];

  return (
    <main className="frontend-page--subpage relative overflow-hidden text-slate-900">
      <section className="relative min-h-[52vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/82 via-slate-900/62 to-slate-950/78" />
        <div className="relative z-10 px-4 pt-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            <header className="flex items-center justify-between gap-4">
              <SiteLogo href="/" className="hero-fade" />
              <nav className="hero-glass-soft-light hero-fade-delay nav-stagger hidden rounded-full border border-white/15 px-3 py-2 text-white shadow-glass lg:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={
                      active === item.key
                        ? "rounded-full bg-white px-5 py-2.5 font-semibold text-slate-950"
                        : "px-5 py-2.5 font-medium text-white/80 transition hover:text-sky-300"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Link
                href="/login"
                className="hero-fade-delay rounded-full bg-white px-5 py-3 font-semibold text-slate-950 shadow-lg transition hover:bg-sky-50"
              >
                Đăng nhập
              </Link>
            </header>

            <div className="py-20 text-center text-white md:py-28">
              <p className="hero-fade text-sm font-semibold uppercase tracking-[0.45em] text-sky-300">{eyebrow}</p>
              <h1 className="hero-fade-delay mt-6 text-5xl font-bold tracking-tight md:text-6xl">{title}</h1>
              <p className="hero-fade-delay-2 mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/78">{description}</p>
            </div>
          </div>
        </div>
      </section>

      {children}
    </main>
  );
}

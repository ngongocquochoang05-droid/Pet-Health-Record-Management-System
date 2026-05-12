"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownIcon,
  BellIcon,
  DotsIcon,
  SearchIcon,
  StarIcon,
  UserIcon,
} from "@/components/icons";
import SiteLogo from "@/components/site-logo";
import useRevealOnScroll from "@/components/use-reveal-on-scroll";

const heroImage =
  "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1800&q=80";

const serviceCards = [
  {
    title: "Tắm & Sấy lông",
    duration: "60 phút",
    price: "150.000đ",
    description:
      "Tắm sạch với dầu gội chuyên dụng, sấy khô hoàn toàn và làm thơm cho thú cưng. Phù hợp với mọi kích cỡ.",
    highlighted: false,
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4v16" />
        <path d="M8 8h6a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h6" />
      </svg>
    ),
  },
  {
    title: "Cắt tỉa lông",
    duration: "90 phút",
    price: "220.000đ",
    description:
      "Cắt tỉa lông theo yêu cầu, tạo kiểu thời trang cho thú cưng. Nhân viên lành nghề với hơn 5 năm kinh nghiệm.",
    highlighted: false,
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3" />
        <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
      </svg>
    ),
  },
  {
    title: "Spa thư giãn cao cấp",
    duration: "120 phút",
    price: "380.000đ",
    description:
      "Gói spa toàn diện: mát-xa thư giãn, dưỡng lông bóng mượt, chăm sóc móng và làm sạch tai. Trải nghiệm sang trọng nhất.",
    highlighted: true,
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 12h14" />
        <path d="M8 7h8" />
        <path d="M8 17h8" />
      </svg>
    ),
  },
];

const teamMembers = [
  {
    label: "Grooming & Tắm sấy",
    name: "Nguyễn Thị Mai",
    description:
      "Chuyên gia grooming với hơn 5 năm kinh nghiệm. Yêu thích làm đẹp cho chó mèo và luôn tạo ra những kiểu tóc ấn tượng.",
    highlighted: false,
  },
  {
    label: "Sức khỏe & Huấn luyện",
    name: "Trần Văn Hùng",
    description:
      "Bác sĩ thú y và chuyên gia huấn luyện. Có bằng thú y từ Đại học Nông Lâm TP.HCM với 7 năm kinh nghiệm thực tế.",
    highlighted: true,
  },
  {
    label: "Spa & Chăm sóc đặc biệt",
    name: "Lê Thị Hoa",
    description:
      "Chuyên gia spa và chăm sóc sắc đẹp thú cưng. Được đào tạo tại Nhật Bản, mang đến trải nghiệm spa đẳng cấp nhất.",
    highlighted: false,
  },
];

const reviews = [
  {
    quote:
      "“Bé nhà mình rất nhát nhưng các bạn chăm cực kỳ kiên nhẫn. Sau buổi grooming lông mềm mượt và thơm rất lâu.”",
    name: "Phạm Minh Tuấn",
    role: "Khách hàng thân thiết",
  },
  {
    quote:
      "“Quy trình đặt lịch rất rõ ràng, nhân viên gọi xác nhận nhanh. Bé mèo của mình được chăm sóc nhẹ nhàng và sạch sẽ.”",
    name: "Nguyễn Thị Lan",
    role: "Khách hàng mới",
  },
  {
    quote:
      "“Dịch vụ spa cao cấp rất xứng đáng. Bé cún được massage, cắt móng và vệ sinh tai rất kỹ, mình hoàn toàn yên tâm.”",
    name: "Trần Quang Minh",
    role: "Khách hàng VIP",
  },
];

const adminStats = [
  {
    title: "Tài khoản người dùng",
    value: "1,284",
    badge: "+46",
    badgeClass: "bg-sky-400/15 text-sky-300",
    valueClass: "text-white",
    description: "Tài khoản mới được tạo trong tháng này",
  },
  {
    title: "Nhân viên đang hoạt động",
    value: "28",
    badge: "Theo ca",
    badgeClass: "bg-sky-400/15 text-sky-300",
    valueClass: "text-sky-300",
    description: "3 nhân viên mới đang chờ cấp quyền truy cập",
  },
  {
    title: "Báo cáo tháng",
    value: "12",
    badge: "Đã tạo",
    badgeClass: "bg-emerald-400/15 text-emerald-300",
    valueClass: "text-white",
    description: "Bao gồm doanh thu, nhân sự và hiệu suất dịch vụ",
  },
  {
    title: "Yêu cầu chờ duyệt",
    value: "4",
    badge: "Cần xem xét",
    badgeClass: "bg-yellow-400/15 text-yellow-300",
    valueClass: "text-yellow-400",
    description: "Gồm yêu cầu mở tài khoản và cập nhật hồ sơ nhân viên",
  },
];

const adminActivities = [
  {
    item: "Tài khoản người dùng",
    subItem: "Khởi tạo mới",
    owner: "Phạm Thu Hà",
    department: "Bộ phận CSKH",
    detail: "Tạo tài khoản mới cho khách hàng VIP và gửi email thiết lập mật khẩu ban đầu.",
    time: "05/05/2026 · 09:20",
    status: "Đã xác nhận",
    statusClass: "bg-sky-500/20 text-sky-300",
  },
  {
    item: "Nhân viên",
    subItem: "Cập nhật hồ sơ",
    owner: "Nguyễn Quốc Bảo",
    department: "Phòng nhân sự",
    detail: "Cập nhật quyền truy cập và lịch làm việc cho nhóm grooming ca chiều.",
    time: "05/05/2026 · 11:05",
    status: "Chờ duyệt",
    statusClass: "bg-yellow-500/20 text-yellow-300",
  },
  {
    item: "Báo cáo thống kê",
    subItem: "Tổng hợp tháng",
    owner: "Lê Minh Quân",
    department: "Phòng vận hành",
    detail: "Xuất báo cáo doanh thu, hiệu suất nhân viên và tỷ lệ người dùng hoạt động.",
    time: "04/05/2026 · 16:45",
    status: "Hoàn thành",
    statusClass: "bg-green-500/20 text-green-400",
  },
];

export function AdminDashboard({ onLogout }) {
  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950 text-white">
      <div
        className="relative flex h-screen w-full overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-black/80 to-black/90" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex h-full w-full">
          <aside className="flex w-64 flex-col border-r border-white/10 bg-black/40 backdrop-blur-lg">
            <div className="border-b border-white/10 p-6">
              <SiteLogo href="/" variant="admin" tag="Quản trị" sidebar />
            </div>

            <nav className="flex-1 px-4 py-6">
              <ul className="space-y-2">
                <li>
                  <button className="flex w-full items-center gap-3 rounded-r-lg border-l-4 border-sky-400 bg-sky-500/20 px-4 py-3 font-medium text-sky-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 10.5 12 3l9 7.5" />
                      <path d="M5.5 9.5V21h13V9.5" />
                    </svg>
                    <span>Tổng quan</span>
                  </button>
                </li>
                <li>
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/70 transition hover:bg-white/5 hover:text-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                      <path d="M8 3.5v3" />
                      <path d="M16 3.5v3" />
                      <path d="M3.5 9.5h17" />
                    </svg>
                    <span>Tài khoản người dùng</span>
                  </button>
                </li>
                <li>
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/70 transition hover:bg-white/5 hover:text-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                      <rect x="4" y="4" width="16" height="16" rx="4" />
                    </svg>
                    <span>Nhân viên</span>
                  </button>
                </li>
                <li>
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/70 transition hover:bg-white/5 hover:text-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M16.5 19a4.5 4.5 0 0 0-9 0" />
                      <circle cx="12" cy="11" r="3.5" />
                      <path d="M5 19h14" />
                    </svg>
                    <span>Phân quyền</span>
                  </button>
                </li>
                <li>
                  <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/70 transition hover:bg-white/5 hover:text-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 19.5h16" />
                      <path d="M7 16V10" />
                      <path d="M12 16V6" />
                      <path d="M17 16v-3" />
                    </svg>
                    <span>Báo cáo</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div className="p-4">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 17l-5-5 5-5" />
                  <path d="M5 12h10" />
                  <path d="M14 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>

          <div className="admin-scroll flex flex-1 flex-col overflow-y-auto">
            <header className="flex items-center justify-between border-b border-white/10 bg-black/20 p-6 backdrop-blur-md">
              <label className="relative w-full max-w-md">
                <span className="sr-only">Tìm kiếm trong bảng điều khiển</span>
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="search"
                  placeholder="Tìm tài khoản, nhân viên hoặc báo cáo..."
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/50 focus:border-sky-300/50 focus:outline-none focus:ring-2 focus:ring-sky-300/20"
                />
              </label>

              <div className="ml-6 flex items-center gap-4">
                <button
                  type="button"
                  className="relative rounded-full border border-white/10 bg-white/5 p-3 text-white/80 transition hover:bg-white/10 hover:text-white"
                  aria-label="Thông báo"
                >
                  <BellIcon />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-sky-400" />
                </button>

                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
                  <Image
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                    alt="Administrator avatar"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold text-white">Olivia Bennett</p>
                    <p className="text-xs text-white/55">Quản trị hệ thống</p>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 p-8">
              <section className="space-y-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Tổng quan vận hành</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                      Chào mừng trở lại,{" "}
                      <span className="font-display italic text-sky-300">Quản trị viên</span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
                      Quản lý tài khoản người dùng, theo dõi nhân viên, kiểm soát phân quyền và xem báo cáo thống kê
                      trong một không gian quản trị tập trung.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    Xuất báo cáo nhanh
                  </button>
                </div>

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Quick statistics">
                  {adminStats.map((stat) => (
                    <article
                      key={stat.title}
                      className="glass-shine relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-dashboard backdrop-blur-md"
                    >
                      <div className="mb-8 flex items-start justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.28em] text-white/60">{stat.title}</p>
                          <h2 className={`mt-4 text-3xl font-bold ${stat.valueClass}`}>{stat.value}</h2>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stat.badgeClass}`}>{stat.badge}</span>
                      </div>
                      <p className="text-sm text-white/55">{stat.description}</p>
                    </article>
                  ))}
                </section>

                <section className="grid gap-5 xl:grid-cols-3">
                  <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-dashboard backdrop-blur-md">
                    <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Quản lý tài khoản</p>
                    <h2 className="mt-4 text-2xl font-bold text-white">Kiểm soát người dùng hệ thống</h2>
                    <p className="mt-4 text-sm leading-7 text-white/60">
                      Kích hoạt, khóa, đặt lại mật khẩu và phân loại tài khoản khách hàng theo trạng thái sử dụng.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-dashboard backdrop-blur-md">
                    <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Quản lý nhân viên</p>
                    <h2 className="mt-4 text-2xl font-bold text-white">Theo dõi đội ngũ nội bộ</h2>
                    <p className="mt-4 text-sm leading-7 text-white/60">
                      Cập nhật hồ sơ, chức vụ, ca làm việc và quyền truy cập của từng nhân viên trong hệ thống.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-dashboard backdrop-blur-md">
                    <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Báo cáo thống kê</p>
                    <h2 className="mt-4 text-2xl font-bold text-white">Ra quyết định từ dữ liệu</h2>
                    <p className="mt-4 text-sm leading-7 text-white/60">
                      Xem báo cáo theo ngày, tuần, tháng để đánh giá hiệu suất vận hành, doanh thu và nguồn lực.
                    </p>
                  </article>
                </section>

                <section className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-md">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Hoạt động quản trị gần đây</h2>
                      <p className="mt-1 text-sm text-white/55">
                        Theo dõi các thay đổi liên quan đến tài khoản người dùng, nhân viên và báo cáo thống kê.
                      </p>
                    </div>
                    <button className="text-sm font-medium text-sky-300 transition hover:text-sky-200">Xem tất cả</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-[0.26em] text-white/50">
                          <th className="pb-3 font-medium">Hạng mục</th>
                          <th className="pb-3 font-medium">Người phụ trách</th>
                          <th className="pb-3 font-medium">Chi tiết</th>
                          <th className="pb-3 font-medium">Thời gian</th>
                          <th className="pb-3 font-medium">Trạng thái</th>
                          <th className="pb-3 font-medium">Tác vụ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminActivities.map((activity, index) => (
                          <tr key={activity.item} className={index !== adminActivities.length - 1 ? "border-b border-white/5 text-sm text-white/80" : "text-sm text-white/80"}>
                            <td className="py-4">
                              <div className="font-medium text-white">{activity.item}</div>
                              <div className="mt-1 text-xs text-white/45">{activity.subItem}</div>
                            </td>
                            <td className="py-4">
                              <div className="font-medium text-white">{activity.owner}</div>
                              <div className="mt-1 text-xs text-white/45">{activity.department}</div>
                            </td>
                            <td className="py-4">{activity.detail}</td>
                            <td className="py-4">{activity.time}</td>
                            <td className="py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${activity.statusClass}`}>
                                {activity.status}
                              </span>
                            </td>
                            <td className="py-4">
                              <button type="button" className="text-white/60 transition hover:text-white" aria-label="Chỉnh sửa hoạt động quản trị">
                                <DotsIcon />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePageClient() {
  useRevealOnScroll();

  const heroParallaxRef = useRef(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!heroParallaxRef.current) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const disableParallax = prefersReducedMotion || window.innerWidth < 1024;

    if (disableParallax) {
      heroParallaxRef.current.style.transform = "translate3d(0, 0, 0) scale(1.04)";
      return undefined;
    }

    let ticking = false;

    const updateScrollEffects = () => {
      if (!heroParallaxRef.current) return;
      const offset = Math.min(window.scrollY * 0.12, 72);
      heroParallaxRef.current.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrollEffects);
    };

    updateScrollEffects();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div id="landing-page" className="frontend-page--landing text-slate-900">
        <main id="trang-chu" className="relative min-h-screen w-full overflow-hidden">
          <div
            ref={heroParallaxRef}
            className="parallax-layer absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/72 via-slate-900/45 to-slate-950/78" />
          <div className="hero-orb-soft absolute left-0 top-0 h-[28rem] w-[28rem] rounded-full bg-sky-300/12" />
          <div className="hero-orb-soft absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-white/10" />

          <div className="relative z-10 flex min-h-screen flex-col">
            <header className="px-4 pt-6 md:px-8">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <SiteLogo href="/" variant="landing" className="hero-fade" />

                <nav className="hero-glass-soft-light hero-fade-delay nav-stagger hidden rounded-full border border-white/15 px-3 py-2 text-white shadow-glass lg:flex">
                  <Link href="/" className="rounded-full bg-white px-5 py-2.5 font-semibold text-slate-950">
                    Trang chủ
                  </Link>
                  <Link href="/dich-vu" className="px-5 py-2.5 font-medium text-white/80 transition hover:text-sky-300">
                    Dịch vụ
                  </Link>
                  <Link href="/dat-lich" className="px-5 py-2.5 font-medium text-white/80 transition hover:text-sky-300">
                    Đặt lịch
                  </Link>
                  <Link href="/phu-kien" className="px-5 py-2.5 font-medium text-white/80 transition hover:text-sky-300">
                    Phụ kiện
                  </Link>
                  <Link href="/danh-gia" className="px-5 py-2.5 font-medium text-white/80 transition hover:text-sky-300">
                    Đánh giá
                  </Link>
                </nav>

                <Link
                  href="/login"
                  className="hero-fade-delay inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 shadow-lg transition hover:bg-sky-50"
                >
                  <UserIcon className="h-5 w-5 text-slate-950/85" />
                  <span>Đăng nhập</span>
                </Link>
              </div>
            </header>

            <section className="flex flex-1 items-center px-4 pb-24 pt-8 md:px-8 md:pb-24">
              <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center">
                <div className="max-w-5xl text-center text-white">
                  <p className="hero-fade text-sm font-semibold uppercase tracking-[0.45em] text-sky-300 md:text-base">
                    Premium Pet Care & Wellness
                  </p>
                  <h1 className="hero-fade-delay mt-7 text-5xl font-bold leading-[0.94] tracking-tight md:text-7xl xl:text-[6.3rem]">
                    <span className="block">Nơi thú cưng</span>
                    <span className="font-display block italic text-sky-300">được yêu thương</span>
                    <span className="block">nhất.</span>
                  </h1>
                  <p className="hero-fade-delay-2 mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/80 md:text-xl">
                    Hệ thống đặt lịch thông minh, đội ngũ chuyên viên chứng chỉ quốc tế. Mỗi dịch vụ là một trải nghiệm
                    đặc biệt cho thú cưng của bạn.
                  </p>

                  <div className="hero-fade-delay-2 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      href="/dat-lich"
                      className="inline-flex min-w-[230px] items-center justify-center gap-3 whitespace-nowrap rounded-full bg-white px-8 py-4 text-lg font-semibold text-slate-950 shadow-xl transition hover:bg-sky-50"
                    >
                      <UserIcon />
                      <span>Đặt lịch ngay — Miễn phí</span>
                    </Link>
                    <Link
                      href="/dich-vu"
                      className="hero-glass-soft-light inline-flex min-w-[230px] items-center justify-center whitespace-nowrap rounded-full border border-white/20 px-8 py-4 text-lg font-semibold text-white shadow-xl transition hover:bg-white/15"
                    >
                      Khám phá dịch vụ
                    </Link>
                  </div>
                </div>

                <div className="hero-glass-soft-light hero-fade-delay-2 mt-14 w-full max-w-5xl rounded-[2rem] border border-white/15 px-5 py-5 text-white shadow-glass md:px-8">
                  <div className="grid gap-4 text-center md:grid-cols-4">
                    <div>
                      <p className="text-3xl font-bold">50+</p>
                      <p className="mt-2 text-sm uppercase tracking-[0.35em] text-white/68">Giống thú cưng</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">15K+</p>
                      <p className="mt-2 text-sm uppercase tracking-[0.35em] text-white/68">Lượt grooming</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">10K+</p>
                      <p className="mt-2 text-sm uppercase tracking-[0.35em] text-white/68">Khách hàng hài lòng</p>
                    </div>
                    <div className="inline-flex flex-col items-center">
                      <div className="inline-flex items-center gap-2">
                        <p className="text-3xl font-bold">4.9</p>
                        <StarIcon />
                      </div>
                      <p className="mt-2 text-sm uppercase tracking-[0.35em] text-white/68">Đánh giá</p>
                    </div>
                  </div>
                </div>

                <div className="hero-glass-soft hero-fade-delay-2 mt-8 w-full max-w-6xl rounded-[2rem] border border-white/20 p-3 shadow-glass">
                  <div className="grid gap-2 md:grid-cols-[1.2fr_1.2fr_1.15fr_auto]">
                    <label className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-left md:border-r md:border-r-white/10">
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">Chọn dịch vụ</span>
                      <select className="mt-3 w-full bg-transparent text-lg font-semibold text-white outline-none">
                        <option className="text-slate-900">Spa</option>
                        <option className="text-slate-900">Grooming</option>
                        <option className="text-slate-900">Khách sạn thú cưng</option>
                      </select>
                    </label>
                    <label className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-left md:border-r md:border-r-white/10">
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">Chọn thú cưng</span>
                      <select className="mt-3 w-full bg-transparent text-lg font-semibold text-white outline-none">
                        <option className="text-slate-900">Chó nhỏ</option>
                        <option className="text-slate-900">Chó lớn</option>
                        <option className="text-slate-900">Mèo</option>
                      </select>
                    </label>
                    <label className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-left">
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">Chọn lịch</span>
                      <input type="date" className="mt-3 w-full bg-transparent text-lg font-semibold text-white outline-none" />
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl bg-sky-400 px-6 py-4 text-white transition hover:bg-sky-500"
                      aria-label="Tìm kiếm lịch hẹn"
                    >
                      <SearchIcon className="h-7 w-7" />
                    </button>
                  </div>
                </div>

                <Link
                  href="#dich-vu"
                  className="scroll-indicator hero-fade-delay-2 scroll-bounce mt-6 inline-flex items-center justify-center text-white transition hover:text-sky-200"
                  aria-label="Cuộn xuống"
                >
                  <ArrowDownIcon />
                </Link>
              </div>
            </section>
          </div>
        </main>

        <section id="dich-vu" className="section-viewport-opt relative bg-white px-4 py-24 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.75rem] border border-sky-100 bg-white px-6 py-14 text-slate-900 shadow-glass md:px-10">
            <div className="reveal mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Dịch vụ của chúng tôi</p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">Dịch vụ chăm sóc thú cưng toàn diện</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                MyPuppy cung cấp dịch vụ chăm sóc thú cưng cao cấp với đội ngũ chuyên viên được đào tạo bài bản, sử dụng
                sản phẩm chất lượng cao và thiết bị hiện đại.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {serviceCards.map((card) => (
                <article
                  key={card.title}
                  className={`reveal rounded-[2rem] p-10 transition hover:-translate-y-1 ${
                    card.highlighted
                      ? "border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-[0_20px_50px_rgba(14,165,233,0.12)] hover:shadow-[0_25px_55px_rgba(14,165,233,0.16)]"
                      : "border border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] hover:shadow-[0_25px_55px_rgba(15,23,42,0.12)]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-2xl p-4 ${card.highlighted ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-600"}`}>
                      {card.icon}
                    </div>
                    <span className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] ${card.highlighted ? "bg-white/80 text-sky-700" : "bg-sky-50 text-sky-600"}`}>
                      {card.duration}
                    </span>
                  </div>
                  <h3 className="mt-8 text-3xl font-bold leading-tight">{card.title}</h3>
                  <p className="mt-5 text-lg leading-8 text-slate-600">{card.description}</p>
                  <p className="mt-8 text-4xl font-bold text-sky-700">{card.price}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dat-lich" className="section-viewport-opt relative bg-white px-4 py-24 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.75rem] border border-sky-100 bg-white px-6 py-14 shadow-glass md:px-10">
            <div className="grid gap-8 xl:grid-cols-[1.05fr_1fr]">
              <div className="reveal rounded-[2rem] bg-slate-50 p-8 md:p-10">
                <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Đặt lịch nhanh</p>
                <h2 className="mt-5 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                  Trải nghiệm đặt lịch chuyên nghiệp, rõ ràng và dễ dùng
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Từ lựa chọn dịch vụ đến xác nhận lịch hẹn, mọi thao tác đều được thiết kế để khách hàng dễ theo dõi,
                  giảm sai sót và tăng sự tin tưởng.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">Xác nhận tức thì</span>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">Giao diện rõ ràng</span>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">Dễ dùng trên điện thoại</span>
                </div>
                <Link
                  href="/login"
                  className="mt-10 inline-flex items-center rounded-full bg-sky-500 px-6 py-3.5 font-semibold text-white transition hover:bg-sky-600"
                >
                  Đăng nhập quản trị để quản lý hệ thống
                </Link>
              </div>

              <div className="reveal rounded-[2rem] border border-sky-100 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-10">
                <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Quy trình 4 bước</p>
                <div className="mt-8 space-y-5">
                  {[
                    {
                      step: "1",
                      title: "Chọn dịch vụ phù hợp",
                      desc: "Spa, grooming hoặc chăm sóc chuyên sâu theo nhu cầu và giống thú cưng.",
                      accent: true,
                    },
                    {
                      step: "2",
                      title: "Điền thông tin thú cưng",
                      desc: "Kích cỡ, giống, thời gian mong muốn và các lưu ý sức khỏe cần thiết.",
                      accent: false,
                    },
                    {
                      step: "3",
                      title: "Xác nhận nhanh",
                      desc: "Hệ thống hiển thị lịch hẹn rõ ràng để khách hàng kiểm tra trước khi gửi.",
                      accent: true,
                    },
                    {
                      step: "4",
                      title: "Admin quản lý toàn hệ thống",
                      desc: "Sau khi đăng nhập, quản trị viên có thể quản lý tài khoản người dùng, nhân viên và theo dõi báo cáo thống kê.",
                      accent: false,
                    },
                  ].map((item) => (
                    <article key={item.step} className={`flex gap-4 rounded-2xl px-5 py-5 ${item.accent ? "bg-sky-50" : "bg-slate-50"}`}>
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white ${item.accent ? "bg-sky-500" : "bg-slate-900"}`}>
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-base leading-7 text-slate-600">{item.desc}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="doi-ngu" className="section-viewport-opt relative bg-white px-4 py-24 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.75rem] border border-sky-100 bg-white px-6 py-14 shadow-glass md:px-10">
            <div className="reveal mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Đội ngũ chuyên gia</p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Gặp gỡ những người yêu thú cưng như bạn</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Đội ngũ chuyên viên giàu kinh nghiệm, được đào tạo bài bản, luôn đặt sức khỏe và hạnh phúc của thú cưng
                lên hàng đầu.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <article
                  key={member.name}
                  className={`reveal rounded-[2rem] p-10 ${
                    member.highlighted
                      ? "border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-[0_18px_45px_rgba(14,165,233,0.10)]"
                      : "border border-slate-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <p className={`text-sm font-bold uppercase tracking-[0.4em] ${member.highlighted ? "text-sky-700" : "text-sky-600"}`}>
                    {member.label}
                  </p>
                  <h3 className="mt-5 text-3xl font-bold text-slate-900">{member.name}</h3>
                  <p className="mt-4 text-lg leading-8 text-slate-600">{member.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="danh-gia" className="section-viewport-opt relative bg-white px-4 py-24 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.75rem] border border-sky-100 bg-white px-6 py-14 shadow-glass md:px-10">
            <div className="reveal mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Phản hồi khách hàng</p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Đánh giá dịch vụ chăm sóc thú cưng từ khách hàng thực tế
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Hơn 300 phản hồi tích cực về chất lượng dịch vụ, mức độ tận tâm và sự chuyên nghiệp trong từng buổi chăm sóc.
              </p>
            </div>

            <div className="mt-14 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="reveal rounded-[2rem] bg-gradient-to-br from-sky-500 to-cyan-400 p-10 text-white shadow-[0_25px_60px_rgba(14,165,233,0.26)]">
                <p className="text-sm font-bold uppercase tracking-[0.45em] text-white/80">Điểm trung bình</p>
                <div className="mt-8 flex items-end gap-4">
                  <span className="text-7xl font-bold leading-none">4.9</span>
                  <span className="pb-2 text-2xl font-semibold text-white/85">/5.0</span>
                </div>
                <div className="mt-6 flex gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={index} className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                  ))}
                </div>
                <p className="mt-6 text-lg leading-8 text-white/85">
                  Khách hàng đánh giá cao sự sạch sẽ, thời gian đúng hẹn và cảm giác an tâm khi gửi thú cưng tại salon.
                </p>
              </div>

              <div className="grid gap-5">
                {reviews.map((review) => (
                  <article key={review.name} className="reveal rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                    <p className="text-lg leading-8 text-slate-600">{review.quote}</p>
                    <div className="mt-6">
                      <h3 className="text-xl font-bold text-slate-900">{review.name}</h3>
                      <p className="mt-1 text-sm uppercase tracking-[0.3em] text-slate-400">{review.role}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-viewport-opt bg-white px-4 pb-24 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.75rem] bg-slate-950 px-6 py-14 text-white shadow-[0_30px_80px_rgba(15,23,42,0.20)] md:px-10">
            <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
              <div className="reveal">
                <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-300">MyPuppy Premium</p>
                <h2 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                  Thú cưng của bạn xứng đáng được trải nghiệm tốt nhất!
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                  Đặt lịch nhanh, nhận tư vấn tận tâm và theo dõi quy trình dịch vụ rõ ràng. Với tài khoản admin, bạn còn có
                  thể quản lý tài khoản người dùng, nhân viên và báo cáo trong cùng một giao diện.
                </p>
              </div>
              <div className="reveal flex flex-col gap-4 sm:flex-row xl:flex-col">
                <Link
                  href="/dat-lich"
                  className="inline-flex min-w-[210px] items-center justify-center rounded-full bg-white px-8 py-4 text-xl font-semibold text-slate-950 transition hover:bg-sky-50"
                >
                  Đặt lịch miễn phí
                </Link>
                <a
                  href="tel:0901234567"
                  className="inline-flex min-w-[210px] items-center justify-center rounded-full border border-white/15 bg-white/10 px-8 py-4 text-xl font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  0901 234 567
                </a>
              </div>
            </div>
            <div className="mt-10 grid gap-4 text-sm font-medium text-white/65 md:grid-cols-4">
              <p>Hủy lịch miễn phí 24h</p>
              <p>Bảo hiểm thú cưng</p>
              <p>Xác nhận tức thì</p>
              <p>Hỗ trợ 7 ngày/tuần</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import SubpageLayout from "@/components/subpage-layout";

const serviceCards = [
  {
    title: "Tắm & Sấy lông",
    duration: "60 phút",
    price: "150.000đ",
    description: "Làm sạch toàn diện, sấy khô kỹ lưỡng và khử mùi nhẹ dịu cho mọi giống chó mèo.",
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
    description: "Tạo kiểu gọn gàng, phù hợp giống loài và cá tính, được thực hiện bởi đội ngũ có kinh nghiệm.",
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
    description: "Massage, dưỡng lông, chăm sóc móng và vệ sinh tai cho trải nghiệm thư giãn trọn vẹn.",
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

export default function ServicePageClient() {
  return (
    <SubpageLayout
      active="services"
      eyebrow="Dịch vụ cao cấp"
      title="Dịch vụ chăm sóc thú cưng tại MyPuppy"
      description="Từ grooming, tắm sấy đến spa thư giãn chuyên sâu, MyPuppy mang đến trải nghiệm chỉn chu và an tâm cho từng bé cưng."
    >
      <section className="bg-white px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl rounded-[2.75rem] border border-sky-100 bg-white px-6 py-14 shadow-[0_25px_80px_rgba(15,23,42,0.12)] md:px-10">
          <div className="reveal mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Gói dịch vụ</p>
            <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">Các lựa chọn nổi bật dành cho thú cưng</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Mỗi dịch vụ được thiết kế để đáp ứng nhu cầu thực tế của thú cưng và chủ nuôi, đảm bảo sạch sẽ, thư giãn và chuyên nghiệp.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {serviceCards.map((card) => (
              <article
                key={card.title}
                className={`reveal rounded-[2rem] p-10 ${
                  card.highlighted
                    ? "border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-[0_20px_50px_rgba(14,165,233,0.12)]"
                    : "border border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
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
                <h3 className="mt-8 text-3xl font-bold">{card.title}</h3>
                <p className="mt-5 text-lg leading-8 text-slate-600">{card.description}</p>
                <p className="mt-8 text-4xl font-bold text-sky-700">{card.price}</p>
              </article>
            ))}
          </div>

          <div className="reveal mt-14 text-center">
            <Link
              href="/dat-lich"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-lg font-semibold text-white transition hover:bg-slate-800"
            >
              Đặt lịch dịch vụ ngay
            </Link>
          </div>
        </div>
      </section>
    </SubpageLayout>
  );
}


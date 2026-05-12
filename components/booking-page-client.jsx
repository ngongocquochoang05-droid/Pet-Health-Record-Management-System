"use client";

import SubpageLayout from "@/components/subpage-layout";

export default function BookingPageClient() {
  return (
    <SubpageLayout
      active="booking"
      eyebrow="Đặt lịch trực tuyến"
      title="Đặt lịch nhanh cùng MyPuppy"
      description="Quy trình rõ ràng, giao diện dễ dùng và xác nhận nhanh giúp bạn chủ động hơn trong việc chăm sóc thú cưng."
    >
      <section className="bg-white px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl rounded-[2.75rem] border border-sky-100 bg-white px-6 py-14 shadow-[0_25px_80px_rgba(15,23,42,0.12)] md:px-10">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_1fr]">
            <div className="reveal rounded-[2rem] bg-slate-50 p-8 md:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Đặt lịch nhanh</p>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Trải nghiệm đặt lịch rõ ràng và chuyên nghiệp
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Từ lựa chọn dịch vụ đến xác nhận thông tin, mọi bước đều được sắp xếp logic để bạn thao tác nhanh và chính xác.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <label className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-600">Dịch vụ</span>
                  <select className="mt-3 w-full bg-transparent text-lg font-semibold text-slate-900 outline-none">
                    <option>Spa</option>
                    <option>Grooming</option>
                    <option>Khách sạn thú cưng</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-600">Thú cưng</span>
                  <select className="mt-3 w-full bg-transparent text-lg font-semibold text-slate-900 outline-none">
                    <option>Chó nhỏ</option>
                    <option>Chó lớn</option>
                    <option>Mèo</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-600">Ngày mong muốn</span>
                  <input type="date" className="mt-3 w-full bg-transparent text-lg font-semibold text-slate-900 outline-none" />
                </label>
              </div>
              <button className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-lg font-semibold text-white transition hover:bg-slate-800">
                Gửi yêu cầu đặt lịch
              </button>
            </div>

            <div className="reveal rounded-[2rem] border border-sky-100 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Quy trình 4 bước</p>
              <div className="mt-8 space-y-5">
                {[
                  {
                    step: "1",
                    title: "Chọn dịch vụ",
                    desc: "Chọn gói chăm sóc phù hợp với nhu cầu và giống thú cưng.",
                    accent: true,
                  },
                  {
                    step: "2",
                    title: "Điền thông tin",
                    desc: "Cung cấp thông tin về thú cưng, thời gian và các lưu ý quan trọng.",
                    accent: false,
                  },
                  {
                    step: "3",
                    title: "Xác nhận nhanh",
                    desc: "Hệ thống hiển thị rõ ràng để bạn kiểm tra trước khi gửi yêu cầu.",
                    accent: true,
                  },
                  {
                    step: "4",
                    title: "MyPuppy tiếp nhận",
                    desc: "Đội ngũ vận hành xác nhận và sắp xếp khung giờ phù hợp cho bạn.",
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
    </SubpageLayout>
  );
}


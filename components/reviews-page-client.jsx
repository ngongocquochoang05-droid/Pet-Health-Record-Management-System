"use client";

import { StarIcon } from "@/components/icons";
import SubpageLayout from "@/components/subpage-layout";

const reviews = [
  {
    quote:
      "“Bé nhà mình rất nhát nhưng đội ngũ MyPuppy cực kỳ kiên nhẫn. Sau buổi grooming lông mềm mượt và thơm rất lâu.”",
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

export default function ReviewsPageClient() {
  return (
    <SubpageLayout
      active="reviews"
      eyebrow="Phản hồi khách hàng"
      title="Khách hàng nói gì về MyPuppy"
      description="Hàng trăm khách hàng tin tưởng lựa chọn MyPuppy nhờ sự tận tâm, sạch sẽ và quy trình chăm sóc rõ ràng."
    >
      <section className="bg-white px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl rounded-[2.75rem] border border-sky-100 bg-white px-6 py-14 shadow-[0_25px_80px_rgba(15,23,42,0.12)] md:px-10">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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
                MyPuppy được khách hàng đánh giá cao ở sự sạch sẽ, đúng hẹn và thái độ chăm sóc dịu dàng với thú cưng.
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
    </SubpageLayout>
  );
}


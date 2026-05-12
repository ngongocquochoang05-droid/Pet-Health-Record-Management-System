"use client";

import Link from "next/link";
import SubpageLayout from "@/components/subpage-layout";

const products = [
  {
    title: "Vitamin tổng hợp cho thú cưng",
    category: "Sức khỏe",
    price: "180.000đ",
    description: "Bổ sung dưỡng chất hằng ngày, hỗ trợ lông mượt, tiêu hóa ổn định và sức đề kháng tốt hơn.",
    badge: "Bán chạy",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 21 21 10" />
        <path d="M8.5 4.5a4.24 4.24 0 0 1 6 6l-4 4a4.24 4.24 0 0 1-6-6Z" />
        <path d="m8 8 8 8" />
      </svg>
    ),
  },
  {
    title: "Vòng cổ thú cưng premium",
    category: "Phụ kiện",
    price: "120.000đ",
    description: "Chất liệu mềm, khóa chắc chắn, dễ điều chỉnh kích thước cho chó mèo nhỏ và vừa.",
    badge: "Mới",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 5v4" />
        <path d="M15 12h4" />
        <path d="M9 12H5" />
      </svg>
    ),
  },
  {
    title: "Dây dắt an toàn",
    category: "Dạo chơi",
    price: "145.000đ",
    description: "Dây chắc tay, móc khóa kim loại bền, phù hợp cho lịch dạo chơi và đưa thú cưng đi spa.",
    badge: "Gợi ý",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 17 17 7" />
        <path d="M6 12a4 4 0 0 1 6-6l1 1" />
        <path d="M18 12a4 4 0 0 1-6 6l-1-1" />
      </svg>
    ),
  },
  {
    title: "Lược chải lông chống rối",
    category: "Grooming",
    price: "95.000đ",
    description: "Thiết kế răng bo tròn, hỗ trợ gỡ rối nhẹ nhàng và chăm lông tại nhà sau buổi grooming.",
    badge: "Tiện dụng",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 4h14v5H5z" />
        <path d="M7 9v11" />
        <path d="M10 9v11" />
        <path d="M13 9v11" />
        <path d="M16 9v11" />
      </svg>
    ),
  },
  {
    title: "Sữa tắm dịu nhẹ",
    category: "Spa tại nhà",
    price: "160.000đ",
    description: "Công thức dịu nhẹ, hỗ trợ làm sạch mùi, giữ da lông mềm mại sau mỗi lần tắm.",
    badge: "An toàn",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 3h6" />
        <path d="M10 3v4l-3 3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9l-3-3V3" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    title: "Bóng nhai giảm stress",
    category: "Đồ chơi",
    price: "75.000đ",
    description: "Chất liệu đàn hồi, giúp thú cưng vận động, chơi đùa và giảm căng thẳng khi ở nhà.",
    badge: "Yêu thích",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M6.5 9.5c3 1 6.5 1 11 0" />
        <path d="M8.5 18c1.2-3.4 1.2-7.4 0-12" />
      </svg>
    ),
  },
];

export default function AccessoriesPageClient() {
  return (
    <SubpageLayout
      active="accessories"
      eyebrow="Cửa hàng phụ kiện"
      title="Phụ kiện chăm sóc thú cưng tại MyPuppy"
      description="Chọn nhanh vitamin, vòng cổ, dây dắt và đồ chăm sóc hằng ngày được tuyển chọn để đồng hành cùng lịch spa và grooming của thú cưng."
    >
      <section className="bg-white px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl px-0 md:px-4">
          <div className="reveal mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.45em] text-sky-600">Sản phẩm nổi bật</p>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">Đồ dùng thiết yếu cho thú cưng khỏe đẹp hơn</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Mỗi sản phẩm được sắp xếp rõ ràng theo nhu cầu chăm sóc: sức khỏe, dạo chơi, grooming và spa tại nhà.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.title}
                className="reveal flex h-full flex-col rounded-[1.5rem] border border-slate-100 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-sky-50 p-4 text-sky-600">{product.icon}</div>
                  <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                    {product.badge}
                  </span>
                </div>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.32em] text-sky-600">{product.category}</p>
                <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-950">{product.title}</h3>
                <p className="mt-4 flex-1 text-base leading-7 text-slate-600">{product.description}</p>
                <div className="mt-7 flex items-center justify-between gap-4 pt-2">
                  <p className="text-2xl font-bold text-sky-700">{product.price}</p>
                  <button className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600">
                    Thêm vào giỏ
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="reveal mt-14 flex flex-col items-center justify-between gap-5 rounded-[1.5rem] bg-slate-950 px-6 py-8 text-white md:flex-row md:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-sky-300">Combo chăm sóc</p>
              <h2 className="mt-3 text-3xl font-bold">Gợi ý phụ kiện theo lịch grooming</h2>
            </div>
            <Link
              href="/dat-lich"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-sky-50"
            >
              Đặt lịch tư vấn
            </Link>
          </div>
        </div>
      </section>
    </SubpageLayout>
  );
}

import ReviewsPageClient from "@/components/reviews-page-client";

export const metadata = {
  title: "Đánh Giá Khách Hàng",
  description: "Xem đánh giá thực tế từ khách hàng đã sử dụng dịch vụ chăm sóc thú cưng của MyPuppy.",
};

export default function ReviewsPage() {
  return <ReviewsPageClient />;
}

import HomePageClient from "@/components/home-page-client";

export const metadata = {
  title: "MyPuppy | Đặt Lịch Chăm Sóc Thú Cưng Cao Cấp",
  description:
    "MyPuppy cung cấp dịch vụ spa, grooming và đặt lịch chăm sóc thú cưng cao cấp với trải nghiệm trực quan, chuyên nghiệp và đáng tin cậy.",
};

const businessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "MyPuppy",
  description: "Dịch vụ spa, grooming và chăm sóc thú cưng cao cấp.",
  telephone: "0901234567",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Đường Nguyễn Huệ",
    addressLocality: "Quận 1",
    addressRegion: "TP.HCM",
    addressCountry: "VN",
  },
  priceRange: "150000-380000 VND",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <HomePageClient />
    </>
  );
}

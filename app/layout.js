import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://mypuppy.vn"),
  title: {
    default: "MyPuppy | Chăm Sóc Thú Cưng Cao Cấp",
    template: "%s | MyPuppy",
  },
  description:
    "MyPuppy là nền tảng đặt lịch chăm sóc thú cưng cao cấp với giao diện hiện đại, trải nghiệm mượt và khu vực quản trị cho admin.",
  keywords: [
    "MyPuppy",
    "chăm sóc thú cưng",
    "spa thú cưng",
    "grooming",
    "đặt lịch thú cưng",
    "quản lý thú cưng",
  ],
  openGraph: {
    title: "MyPuppy | Chăm Sóc Thú Cưng Cao Cấp",
    description:
      "Đặt lịch spa, grooming và theo dõi trải nghiệm chăm sóc thú cưng với giao diện premium hiện đại.",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyPuppy | Chăm Sóc Thú Cưng Cao Cấp",
    description:
      "Landing page và admin dashboard cho hệ thống đặt lịch chăm sóc thú cưng MyPuppy.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}


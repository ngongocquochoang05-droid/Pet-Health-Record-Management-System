import LoginPageClient from "@/components/login-page-client";

export const metadata = {
  title: "Đăng Nhập Quản Trị | MyPuppy",
  description: "Đăng nhập trang quản trị MyPuppy để quản lý người dùng, nhân viên và báo cáo thống kê.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}

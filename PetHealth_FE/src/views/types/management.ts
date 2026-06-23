export interface StaffDto {
  maNhanVien: string;
  hoVaTen: string;
  email: string;
  soDienThoai?: string | null;
  chuyenMon?: string | null;
  namKinhNghiem?: number | null;
  diemDanhGia?: number | null;
  sanSangLamViec: boolean;
}

export interface StaffUpsertDto {
  maNhanVien: string;
  hoVaTen: string;
  email: string;
  soDienThoai?: string | null;
  chuyenMon: string;
  namKinhNghiem: number;
  diemDanhGia: number;
  sanSangLamViec: boolean;
}

export interface ServiceUpsertDto {
  tenDichVu: string;
  moTa?: string | null;
  giaTien: number;
  thoiGianThucHien: number;
  anhDichVuUrl?: string | null;
  loaiThuCung?: string | null;
  trangThaiHoatDong: boolean;
}

export interface DailyBookingReportDto {
  ngayHen: string;
  soLich: number;
}

export interface MonthlyBookingReportDto {
  nam: number;
  thang: number;
  soLich: number;
}

export interface TopServiceReportDto {
  maDichVu: number;
  tenDichVu: string;
  soLanDat: number;
}

export interface ReportSummaryDto {
  lichTheoNgay: DailyBookingReportDto[];
  lichTheoThang: MonthlyBookingReportDto[];
  topDichVu: TopServiceReportDto[];
  tongDoanhThu: number;
  tongKhachHang: number;
  khachHangMoiThangNay: number;
  hieuSuatNhanVien: StaffPerformanceDto[];
}

export interface StaffPerformanceDto {
  maNhanVien: string;
  hoVaTen: string;
  soLichDuocGiao: number;
  soLichHoanThanh: number;
  doanhThu: number;
}

export interface UpdateUserRoleDto {
  vaiTro: 'Admin' | 'Staff' | 'Customer';
  trangThaiHoatDong: boolean;
}

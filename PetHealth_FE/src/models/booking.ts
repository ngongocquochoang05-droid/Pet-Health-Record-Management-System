export const LICH_HEN_STATUS = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
  NoShow: 'NO_SHOW'
} as const;

export type LichHenStatus = typeof LICH_HEN_STATUS[keyof typeof LICH_HEN_STATUS];

export interface CreateLichHenDto {
  maNguoiDung: string;
  maThuCung: number;
  maDichVu: number;
  maDichVus: number[];
  ngayHen: string;
  gioHen: string;
  ghiChu?: string | null;
}

export interface LichHenDto {
  maLichHen: number;
  maNguoiDung: string;
  tenKhachHang: string;
  maThuCung: number;
  tenThuCung: string;
  maDichVu: number;
  maDichVus: number[];
  tenDichVu: string;
  maNhanVien?: string | null;
  tenNhanVien?: string | null;
  ngayHen: string;
  gioHen: string;
  trangThai: LichHenStatus | string;
  tongTien: number;
  ghiChu?: string | null;
  createdAt: string;
}

export interface UpdateLichHenStatusDto {
  trangThai: LichHenStatus;
  ghiChu?: string | null;
}

export interface UpdateLichHenDto {
  maThuCung: number;
  maDichVu: number;
  maDichVus: number[];
  ngayHen: string;
  gioHen: string;
  ghiChu?: string | null;
}

export interface SuggestedDateDto {
  ngayHen: string;
  soLich: number;
}

export interface BookingAvailabilityDto {
  ngayHen: string;
  gioHen: string;
  soLichTrongNgay: number;
  soLichTrongKhungGio: number;
  ngayDangDong: boolean;
  khungGioDangDong: boolean;
  thongBao: string;
  ngayGoiY: SuggestedDateDto[];
}

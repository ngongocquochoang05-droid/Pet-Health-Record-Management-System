export interface HoaDonDto {
  maHoaDon: number;
  maLichHen?: number | null;
  maKhachHang?: string | null;
  tenKhachHang?: string | null;
  tongTien: number;
  phuongThucThanhToan?: string | null;
  trangThaiThanhToan?: string | null;
  maNhanVienXacNhan?: string | null;
  ngayThanhToan?: string | null;
}

export interface UpsertHoaDonDto {
  maLichHen: number;
  tongTien: number;
  phuongThucThanhToan: string;
  trangThaiThanhToan: string;
}

export interface CaLamViecDto {
  maCaLam: number;
  maNhanVien: string;
  tenNhanVien?: string | null;
  ngayLam: string;
  gioBatDau: string;
  gioKetThuc: string;
  trangThai: string;
  ghiChu?: string | null;
}

export interface UpsertCaLamViecDto {
  maNhanVien: string;
  ngayLam: string;
  gioBatDau: string;
  gioKetThuc: string;
  trangThai: string;
  ghiChu?: string | null;
}

export interface CustomerUsageDto {
  maKhachHang: string;
  hoVaTen: string;
  email: string;
  loginCount: number;
  lastLoginAt?: string | null;
  soLanDat: number;
  soLanHoanThanh: number;
  dichVuDaDung?: string | null;
}

export interface PetQrDto {
  maThuCung: number;
  tenThuCung: string;
  tenChuNuoi?: string;
  emailChuNuoi?: string;
  maQr?: string | null;
  qrCodeUrl?: string | null;
  ngayCapQr?: string | null;
  emailDaGui?: boolean;
}

export interface PetHistoryDto {
  maLichHen: number;
  maThuCung: number;
  tenThuCung: string;
  tenDichVu: string;
  ngayHen: string;
  gioHen: string;
  trangThai: string;
  ghiChu?: string | null;
  maHoSo?: number | null;
  chanDoan?: string | null;
  dieuTri?: string | null;
  thuoc?: string | null;
  tiemChung?: string | null;
  ghiChuBenhAn?: string | null;
  ngayCapNhatBenhAn?: string | null;
  tenNhanVienCapNhat?: string | null;
}

export interface ReminderDto {
  maNhacLich: number;
  maLichHen: number;
  maKhachHang: string;
  email: string;
  ngayTaiKham: string;
  noiDung?: string | null;
  trangThai: string;
  ngayTao: string;
  ngayGui?: string | null;
}

export interface CreateReminderDto {
  maLichHen: number;
  ngayTaiKham: string;
  noiDung?: string | null;
}

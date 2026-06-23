export interface DanhGiaDto {
  maDanhGia: number;
  maLichHen: number;
  maKhachHang: string;
  tenKhachHang: string;
  maDichVu?: number | null;
  tenDichVu?: string | null;
  soSao: number;
  nhanXet?: string | null;
  ngayTao: string;
}

export interface CreateDanhGiaDto {
  maLichHen: number;
  soSao: number;
  nhanXet?: string | null;
}

export interface HoaDonDto {
  maHoaDon: number;
  maLichHen?: number | null;
  maKhachHang?: string | null;
  tenKhachHang?: string | null;
  tongTien: number;
  tongTienTruocUuDai: number;
  maPhieu?: number | null;
  tenUuDai?: string | null;
  loaiGiamGia?: string | null;
  giaTriGiam: number;
  phuongThucThanhToan?: string | null;
  trangThaiThanhToan?: string | null;
  maNhanVienXacNhan?: string | null;
  ngayThanhToan?: string | null;
}

export interface UpsertHoaDonDto {
  maLichHen: number;
  tongTien: number;
  maPhieu?: number | null;
  phuongThucThanhToan: string;
  trangThaiThanhToan: string;
}

export interface ChuongTrinhUuDaiDto {
  maUuDai: number;
  tenUuDai?: string | null;
  soLuotYeuCau: number;
  thoiHanThang: number;
  loaiGiamGia: 'Full' | 'Percent' | 'Fixed' | string;
  giaTriGiam: number;
  trangThai: boolean;
}

export interface UpsertUuDaiDto {
  tenUuDai: string;
  soLuotYeuCau: number;
  thoiHanThang: number;
  loaiGiamGia: 'Full' | 'Percent' | 'Fixed' | string;
  giaTriGiam: number;
  trangThai: boolean;
}

export interface PhieuUuDaiDto {
  maPhieu: number;
  maKhachHang?: string | null;
  maUuDai?: number | null;
  tenUuDai?: string | null;
  loaiGiamGia?: string | null;
  giaTriGiam: number;
  ngayCap?: string | null;
  hanSuDung?: string | null;
  daSuDung: boolean;
  maLichHenSuDung?: number | null;
}

export interface IssueUuDaiDto {
  maKhachHang: string;
  maUuDai: number;
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

export interface PetVisitImageDto {
  maAnh: number;
  maLichHen: number;
  maThuCung: number;
  tenThuCung: string;
  tenDichVu?: string | null;
  ngayHen?: string | null;
  gioHen?: string | null;
  loaiAnh: string;
  anhUrl: string;
  ghiChu?: string | null;
  ngayTaiLen: string;
}

export interface CreatePetVisitImageDto {
  maLichHen: number;
  maThuCung: number;
  loaiAnh: 'Before' | 'After';
  anhUrl: string;
  ghiChu?: string | null;
}

export interface DepositDto {
  maDatCoc: number;
  maLichHen: number;
  maKhachHang: string;
  tenKhachHang?: string | null;
  soTien: number;
  phuongThuc: string;
  maGiaoDich: string;
  trangThai: string;
  ngayTao: string;
  ngayThanhToan?: string | null;
  bienLaiUrl?: string | null;
  ghiChuKhachHang?: string | null;
  maNguoiDuyet?: string | null;
  ngayDuyet?: string | null;
  lyDoTuChoi?: string | null;
}

export interface CreateDepositDto {
  maLichHen: number;
  soTien: number;
}

export interface BankTransferInfoDto {
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  note: string;
}

export interface BankTransferDepositResponseDto {
  maDatCoc: number;
  deposit?: DepositDto | null;
  bankTransfer: BankTransferInfoDto;
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

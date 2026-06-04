export interface DichVuDto {
  maDichVu: number;
  tenDichVu: string;
  moTa: string;
  giaTien: number;
  thoiGianThucHien: number;
  anhDichVuUrl?: string | null;
  loaiThuCung?: string | null;
  trangThaiHoatDong: boolean;
  soLanDat: number;
  diemTrungBinh?: number | null;
  soDanhGia: number;
}

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

export interface UpdateUserRoleDto {
  vaiTro: 'Admin' | 'Staff' | 'Customer';
  trangThaiHoatDong: boolean;
}

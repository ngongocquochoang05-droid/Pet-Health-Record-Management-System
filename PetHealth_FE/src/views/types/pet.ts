export interface ThuCungDto {
  maThuCung: number;
  maNguoiDung: string;
  tenThuCung: string;
  loaiThuCung: string;
  giong: string;
  gioiTinh?: string | null;
  ngaySinh?: string | null;
  canNang?: number | null;
  ghiChu?: string | null;
  trangThaiHoatDong: boolean;
}

export interface CreateThuCungDto {
  maNguoiDung: string;
  tenThuCung: string;
  loaiThuCung: string;
  giong: string;
  gioiTinh?: string | null;
  ngaySinh?: string | null;
  canNang?: number | null;
  ghiChu?: string | null;
}

export interface UpdateThuCungDto {
  tenThuCung: string;
  loaiThuCung: string;
  giong: string;
  gioiTinh?: string | null;
  ngaySinh?: string | null;
  canNang?: number | null;
  ghiChu?: string | null;
}

export interface NguoiDungDto {
  maNguoiDung: string;
  hoVaTen: string;
  email: string;
  soDienThoai?: string | null;
  gioiTinh?: string | null;
  diaChi?: string | null;
  vaiTro: string;
  trangThaiHoatDong: boolean;
}

export interface UpdateNguoiDungDto {
  hoVaTen: string;
  soDienThoai?: string | null;
  gioiTinh?: string | null;
  diaChi?: string | null;
}

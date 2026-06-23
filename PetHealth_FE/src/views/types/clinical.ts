export interface MedicalRecordDto {
  maHoSo: number;
  maLichHen: number;
  maThuCung: number;
  tenThuCung: string;
  maNhanVien?: string | null;
  tenNhanVien?: string | null;
  chanDoan: string;
  dieuTri?: string | null;
  thuoc?: string | null;
  tiemChung?: string | null;
  ghiChu?: string | null;
  ngayCapNhat: string;
}

export interface UpsertMedicalRecordDto {
  maLichHen: number;
  maThuCung: number;
  chanDoan: string;
  dieuTri?: string | null;
  thuoc?: string | null;
  tiemChung?: string | null;
  ghiChu?: string | null;
}

import type { DichVuDto } from '../types/service';

interface ServiceCardProps {
  service: DichVuDto;
  onBook: (serviceId: number) => void;
}

export function ServiceCard({ service, onBook }: ServiceCardProps) {
  const imageUrl = service.anhDichVuUrl || 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80';

  return (
    <article className="service-card">
      <img className="service-card__image" src={imageUrl} alt={service.tenDichVu} />
      <div className="service-card__head">
        <p className="service-duration">{service.thoiGianThucHien} phút</p>
        <span className="status-badge">{service.trangThaiHoatDong ? 'Sẵn sàng' : 'Tạm tắt'}</span>
      </div>

      <h3>{service.tenDichVu}</h3>
      <p>{service.moTa}</p>

      <div className="detail-list compact-list">
        <div>
          <span>Phù hợp</span>
          <strong>{service.loaiThuCung || 'Chó, mèo và thú cưng nhỏ'}</strong>
        </div>
        <div>
          <span>Lượt đặt</span>
          <strong>{service.soLanDat} lịch</strong>
        </div>
      </div>

      <div className="service-card__foot">
        <strong>{new Intl.NumberFormat('vi-VN').format(service.giaTien)} VND</strong>
        <button className="secondary-button" disabled={!service.trangThaiHoatDong} onClick={() => onBook(service.maDichVu)} type="button">
          Đặt lịch
        </button>
      </div>
    </article>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from '../components/ServiceCard';
import type { DichVuDto } from '../types/service';

interface ServicesPageProps {
  services: DichVuDto[];
}

export function ServicesPage({ services }: ServicesPageProps) {
  const navigate = useNavigate();
  const topServices = useMemo(
    () => [...services].sort((left, right) => right.soLanDat - left.soLanDat).slice(0, 3),
    [services]
  );

  return (
    <div className="page-grid">
      <section className="content-panel full-width">
        <div className="section-head">
          <div>
            <p className="eyebrow">Dịch vụ phòng khám</p>
            <h2>Danh mục dịch vụ đang hoạt động</h2>
          </div>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <ServiceCard
              key={service.maDichVu}
              service={service}
              onBook={(serviceId) => navigate(`/booking?serviceId=${serviceId}`)}
            />
          ))}
        </div>
      </section>

      <section className="content-panel full-width">
        <div className="section-head">
          <div>
            <p className="eyebrow">Được đặt nhiều</p>
            <h2>Dịch vụ được khách hàng sử dụng thường xuyên</h2>
          </div>
        </div>
        <div className="stack-list">
          {topServices.map((service) => (
            <article className="list-card" key={service.maDichVu}>
              <div>
                <strong>{service.tenDichVu}</strong>
                <p>{service.loaiThuCung || 'Phù hợp nhiều loại thú cưng'}</p>
              </div>
              <span>{service.soLanDat} lượt đặt</span>
            </article>
          ))}
          {topServices.length === 0 ? <p className="empty-state">Chưa có dữ liệu dịch vụ.</p> : null}
        </div>
      </section>
    </div>
  );
}

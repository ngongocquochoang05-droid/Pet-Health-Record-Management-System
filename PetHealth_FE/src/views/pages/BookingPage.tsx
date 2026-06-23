import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api';
import { createBooking, getBookingAvailability } from '../api/bookingApi';
import type { AuthResponseDto } from '../types/auth';
import type { BookingAvailabilityDto, CreateLichHenDto } from '../types/booking';
import type { ThuCungDto } from '../types/pet';
import type { DichVuDto } from '../types/service';

interface BookingPageProps {
  session: AuthResponseDto | null;
  pets: ThuCungDto[];
  services: DichVuDto[];
  onBookingCreated: () => Promise<void>;
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function BookingPage({ session, pets, services, onBookingCreated }: BookingPageProps) {
  const [params] = useSearchParams();
  const today = new Date().toISOString().slice(0, 10);
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<BookingAvailabilityDto | null>(null);
  const initialServiceId = Number(params.get('serviceId')) || services[0]?.maDichVu || 0;
  const [form, setForm] = useState<CreateLichHenDto>({
    maNguoiDung: session?.user.maNguoiDung ?? '',
    maThuCung: pets[0]?.maThuCung ?? 0,
    maDichVu: initialServiceId,
    maDichVus: initialServiceId ? [initialServiceId] : [],
    ngayHen: '',
    gioHen: '09:00',
    ghiChu: ''
  });

  const selectedPet = pets.find((pet) => pet.maThuCung === form.maThuCung);
  const selectedServices = services.filter((service) => form.maDichVus.includes(service.maDichVu));
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.giaTien, 0);
  const filteredServices = useMemo(() => {
    if (!selectedPet) {
      return services;
    }

    const petText = normalizeText(`${selectedPet.loaiThuCung} ${selectedPet.giong}`);
    return services.filter((service) => {
      const target = normalizeText(service.loaiThuCung || service.moTa || service.tenDichVu);
      return !service.loaiThuCung || target.includes('tat ca') || petText.split(' ').some((word) => word && target.includes(word));
    });
  }, [selectedPet, services]);

  useEffect(() => {
    const requestedServiceId = Number(params.get('serviceId'));
    setForm((current) => ({
      ...current,
      maNguoiDung: session?.user.maNguoiDung ?? '',
      maThuCung: current.maThuCung || pets[0]?.maThuCung || 0,
      maDichVu: requestedServiceId || current.maDichVus[0] || services[0]?.maDichVu || 0,
      maDichVus: requestedServiceId
        ? Array.from(new Set([requestedServiceId, ...current.maDichVus]))
        : current.maDichVus.length
          ? current.maDichVus
          : services[0]?.maDichVu
            ? [services[0].maDichVu]
            : []
    }));
  }, [params, pets, services, session]);

  function toggleService(serviceId: number): void {
    setForm((current) => {
      const isSelected = current.maDichVus.includes(serviceId);
      const maDichVus = isSelected
        ? current.maDichVus.filter((id) => id !== serviceId)
        : [...current.maDichVus, serviceId];
      return { ...current, maDichVus, maDichVu: maDichVus[0] ?? 0 };
    });
  }

  useEffect(() => {
    if (!form.ngayHen || !form.gioHen) {
      setAvailability(null);
      return;
    }

    void getBookingAvailability(form.ngayHen, form.gioHen)
      .then(setAvailability)
      .catch(() => setAvailability(null));
  }, [form.ngayHen, form.gioHen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session || submitting) {
      return;
    }

    try {
      if (!window.confirm('Bạn có xác nhận tạo lịch hẹn này không?')) {
        return;
      }

      setSubmitting(true);
      await createBooking({
        ...form,
        maNguoiDung: session.user.maNguoiDung
      });
      setMessage('Đặt lịch thành công.');
      setForm((current) => ({ ...current, ghiChu: '', ngayHen: '', gioHen: '09:00' }));
      await onBookingCreated();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return <section className="content-panel"><p className="empty-state">Đăng nhập để tạo lịch hẹn mới.</p></section>;
  }

  return (
    <div className="split-grid">
      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Đặt lịch khám</p>
            <h2>Tạo lịch hẹn mới cho thú cưng</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Thú cưng
            <select value={form.maThuCung} onChange={(event) => setForm((current) => ({ ...current, maThuCung: Number(event.target.value) }))}>
              {pets.map((pet) => (
                <option key={pet.maThuCung} value={pet.maThuCung}>
                  {pet.tenThuCung} - {pet.giong}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="service-picker full-span">
            <legend>Dịch vụ</legend>
            <div className="service-picker__grid">
              {filteredServices.map((service) => (
                <label className="service-picker__option" key={service.maDichVu}>
                  <input
                    checked={form.maDichVus.includes(service.maDichVu)}
                    onChange={() => toggleService(service.maDichVu)}
                    type="checkbox"
                  />
                  <span>
                    <strong>{service.tenDichVu}</strong>
                    <small>{new Intl.NumberFormat('vi-VN').format(service.giaTien)} VND</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Ngày hẹn
            <input
              value={form.ngayHen}
              onChange={(event) => setForm((current) => ({ ...current, ngayHen: event.target.value }))}
              min={today}
              max={`${new Date().getFullYear()}-12-31`}
              type="date"
            />
          </label>
          <label>
            Giờ hẹn
            <input value={form.gioHen} onChange={(event) => setForm((current) => ({ ...current, gioHen: event.target.value }))} min="08:00" max="17:00" type="time" />
          </label>
          <label className="full-span">
            Ghi chú
            <textarea value={form.ghiChu ?? ''} onChange={(event) => setForm((current) => ({ ...current, ghiChu: event.target.value }))} rows={4} />
          </label>
          <button className={`primary-button${submitting ? ' is-loading' : ''}`} disabled={submitting || !form.maThuCung || !form.maDichVus.length || !form.ngayHen} type="submit">
            {submitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
          </button>
        </form>

        {message ? <p className="feedback-line">{message}</p> : null}
      </section>

      <section className="content-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Tóm tắt</p>
            <h2>Thông tin lịch hẹn</h2>
          </div>
        </div>

        <div className="booking-summary">
          <div>
            <span>Thú cưng</span>
            <strong>{selectedPet ? `${selectedPet.tenThuCung} - ${selectedPet.giong}` : 'Chưa chọn'}</strong>
          </div>
          <div>
            <span>Dịch vụ</span>
            <strong>{selectedServices.length ? selectedServices.map((service) => service.tenDichVu).join(', ') : 'Chưa chọn'}</strong>
          </div>
          <div>
            <span>Ngày giờ</span>
            <strong>{form.ngayHen ? `${form.ngayHen} lúc ${form.gioHen}` : 'Chưa chọn ngày'}</strong>
          </div>
          <div className="booking-summary__total">
            <span>Tạm tính</span>
            <strong>{new Intl.NumberFormat('vi-VN').format(totalPrice)} VND</strong>
          </div>
        </div>

        {availability ? <p className="booking-availability">{availability.thongBao}</p> : null}
      </section>
    </div>
  );
}

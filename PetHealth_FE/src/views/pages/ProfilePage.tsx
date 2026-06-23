import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api';
import { updateCurrentUser } from '../api/authApi';
import { saveSession } from '../api/authStorage';
import { createPet, deletePet, updatePet } from '../api/petApi';
import type { AuthResponseDto } from '../types/auth';
import type { CreateThuCungDto, ThuCungDto, UpdateThuCungDto } from '../types/pet';
import type { UpdateNguoiDungDto } from '../types/user';

interface ProfilePageProps {
  session: AuthResponseDto | null;
  pets: ThuCungDto[];
  onSessionChanged: (session: AuthResponseDto) => void;
  onPetsChanged: () => Promise<void>;
}

function emptyPet(maNguoiDung: string): CreateThuCungDto {
  return {
    maNguoiDung,
    tenThuCung: '',
    loaiThuCung: 'Chó',
    giong: '',
    gioiTinh: 'Đực',
    ngaySinh: '',
    canNang: null,
    ghiChu: ''
  };
}

function toPetForm(pet: ThuCungDto, maNguoiDung: string): CreateThuCungDto {
  return {
    maNguoiDung,
    tenThuCung: pet.tenThuCung,
    loaiThuCung: pet.loaiThuCung,
    giong: pet.giong,
    gioiTinh: pet.gioiTinh ?? '',
    ngaySinh: pet.ngaySinh ?? '',
    canNang: pet.canNang ?? null,
    ghiChu: pet.ghiChu ?? ''
  };
}

function getPetInitial(pet: ThuCungDto): string {
  return pet.tenThuCung.trim()[0]?.toUpperCase() || 'P';
}

export function ProfilePage({ session, pets, onSessionChanged, onPetsChanged }: ProfilePageProps) {
  const [profileForm, setProfileForm] = useState<UpdateNguoiDungDto>({
    hoVaTen: session?.user.hoVaTen ?? '',
    soDienThoai: session?.user.soDienThoai ?? '',
    gioiTinh: session?.user.gioiTinh ?? '',
    diaChi: session?.user.diaChi ?? ''
  });
  const [petForm, setPetForm] = useState<CreateThuCungDto>(emptyPet(session?.user.maNguoiDung ?? ''));
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [profileMessage, setProfileMessage] = useState<string>('');
  const [petMessage, setPetMessage] = useState<string>('');
  const [submittingProfile, setSubmittingProfile] = useState<boolean>(false);
  const [submittingPet, setSubmittingPet] = useState<boolean>(false);

  const initials = useMemo(() => {
    const words = session?.user.hoVaTen.trim().split(/\s+/).filter(Boolean) ?? [];
    return words.slice(-2).map((word) => word[0]?.toUpperCase()).join('') || 'PH';
  }, [session]);

  const completionPercentage = useMemo(() => {
    const completedFields = [profileForm.hoVaTen, session?.user.email, profileForm.soDienThoai, profileForm.gioiTinh, profileForm.diaChi]
      .filter((value) => Boolean(value?.trim())).length;
    return completedFields * 20;
  }, [profileForm, session]);

  useEffect(() => {
    setProfileForm({
      hoVaTen: session?.user.hoVaTen ?? '',
      soDienThoai: session?.user.soDienThoai ?? '',
      gioiTinh: session?.user.gioiTinh ?? '',
      diaChi: session?.user.diaChi ?? ''
    });
    setPetForm(emptyPet(session?.user.maNguoiDung ?? ''));
    setEditingPetId(null);
  }, [session]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session) {
      return;
    }

    setSubmittingProfile(true);
    try {
      const user = await updateCurrentUser(profileForm);
      const nextSession = { ...session, user };
      saveSession(nextSession);
      onSessionChanged(nextSession);
      setProfileMessage('Đã cập nhật hồ sơ cá nhân.');
    } catch (error) {
      setProfileMessage(getApiErrorMessage(error));
    } finally {
      setSubmittingProfile(false);
    }
  }

  async function handlePetSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!session) {
      return;
    }

    setSubmittingPet(true);
    try {
      const payload: UpdateThuCungDto = {
        ...petForm,
        canNang: petForm.canNang ? Number(petForm.canNang) : null
      };

      if (editingPetId) {
        await updatePet(editingPetId, payload);
        setPetMessage('Đã cập nhật hồ sơ thú cưng.');
      } else {
        await createPet({ ...payload, maNguoiDung: session.user.maNguoiDung });
        setPetMessage('Đã thêm thú cưng mới.');
      }

      setEditingPetId(null);
      setPetForm(emptyPet(session.user.maNguoiDung));
      await onPetsChanged();
    } catch (error) {
      setPetMessage(getApiErrorMessage(error));
    } finally {
      setSubmittingPet(false);
    }
  }

  async function handleDeletePet(pet: ThuCungDto): Promise<void> {
    if (!window.confirm(`Bạn có chắc muốn xóa hồ sơ ${pet.tenThuCung}?`)) {
      return;
    }

    try {
      await deletePet(pet.maThuCung);
      setPetMessage('Đã xóa hồ sơ thú cưng.');
      await onPetsChanged();
    } catch (error) {
      setPetMessage(getApiErrorMessage(error));
    }
  }

  function beginEditPet(pet: ThuCungDto): void {
    if (!session) {
      return;
    }

    setEditingPetId(pet.maThuCung);
    setPetForm(toPetForm(pet, session.user.maNguoiDung));
    setPetMessage('');
  }

  function cancelEditPet(): void {
    setEditingPetId(null);
    setPetForm(emptyPet(session?.user.maNguoiDung ?? ''));
  }

  if (!session) {
    return <section className="content-panel"><p className="empty-state">Đăng nhập để quản lý hồ sơ cá nhân và thú cưng.</p></section>;
  }

  if (session.user.vaiTro !== 'Customer') {
    return <Navigate replace to={session.user.vaiTro === 'Admin' ? '/admin/overview' : '/staff/overview'} />;
  }

  return (
    <div className="profile-page">
      <section className="profile-overview">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div className="profile-overview__identity">
          <p className="eyebrow">Hồ sơ khách hàng</p>
          <h2>{session.user.hoVaTen}</h2>
          <p>{session.user.email}</p>
          <div className="profile-badges">
            <span>Khách hàng PetHealth</span>
            <span className={session.user.trangThaiHoatDong ? 'profile-badge--active' : 'profile-badge--inactive'}>
              {session.user.trangThaiHoatDong ? 'Đang hoạt động' : 'Đã tạm khóa'}
            </span>
          </div>
        </div>
        <div className="profile-completion">
          <div>
            <span>Hoàn thiện hồ sơ</span>
            <strong>{completionPercentage}%</strong>
          </div>
          <div className="profile-progress" aria-label={`Hồ sơ đã hoàn thiện ${completionPercentage}%`}>
            <span style={{ width: `${completionPercentage}%` }} />
          </div>
          <p>{pets.length} thú cưng đang được theo dõi trong tài khoản.</p>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="content-panel profile-form-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Thông tin cá nhân</p>
              <h2>Thông tin liên hệ</h2>
            </div>
          </div>

          <form className="form-grid profile-form" onSubmit={handleProfileSubmit}>
            <label>
              Họ và tên
              <input autoComplete="name" placeholder="Nhập họ và tên" required value={profileForm.hoVaTen} onChange={(event) => setProfileForm((current) => ({ ...current, hoVaTen: event.target.value }))} />
            </label>
            <label>
              Số điện thoại
              <input autoComplete="tel" inputMode="tel" placeholder="Nhập số điện thoại" value={profileForm.soDienThoai ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, soDienThoai: event.target.value }))} />
            </label>
            <label>
              Giới tính
              <select value={profileForm.gioiTinh ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, gioiTinh: event.target.value }))}>
                <option value="">Chưa cập nhật</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </label>
            <label>
              Email
              <input disabled type="email" value={session.user.email} />
            </label>
            <label className="full-span">
              Địa chỉ
              <textarea autoComplete="street-address" placeholder="Nhập địa chỉ liên hệ" rows={4} value={profileForm.diaChi ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, diaChi: event.target.value }))} />
            </label>
            <div className="profile-form__actions full-span">
              <button className="primary-button" disabled={submittingProfile} type="submit">
                {submittingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>

          {profileMessage ? <p className="feedback-line">{profileMessage}</p> : null}
        </section>

        <aside className="content-panel profile-account-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Tài khoản</p>
              <h2>Thông tin đăng nhập</h2>
            </div>
          </div>
          <dl className="profile-account-list">
            <div>
              <dt>Email đăng nhập</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt>Vai trò</dt>
              <dd>Khách hàng</dd>
            </div>
            <div>
              <dt>Hồ sơ thú cưng</dt>
              <dd>{pets.length} hồ sơ</dd>
            </div>
          </dl>
          <p className="profile-account-note">Email đăng nhập được bảo vệ và không thể thay đổi trực tiếp tại đây.</p>
        </aside>
      </div>

      <section className="profile-pets-section">
        <div className="profile-pets-heading">
          <div>
            <p className="eyebrow">Gia đình thú cưng</p>
            <h2>Danh sách hồ sơ thú cưng</h2>
            <p>Quản lý thông tin cơ bản để đặt lịch và theo dõi lịch sử chăm sóc chính xác hơn.</p>
          </div>
          <span>{pets.length} hồ sơ</span>
        </div>

        <div className="profile-pet-list profile-pet-list--table" aria-label="Danh sách hồ sơ thú cưng">
          <div className="profile-pet-list-header" aria-hidden="true">
            <span>Thú cưng</span>
            <span>Loài/Giống</span>
            <span>Giới tính</span>
            <span>Ngày sinh</span>
            <span>Cân nặng</span>
            <span>Thao tác</span>
          </div>

          {pets.map((pet) => (
            <article className={editingPetId === pet.maThuCung ? 'profile-pet-row profile-pet-row--active' : 'profile-pet-row'} key={pet.maThuCung}>
              <div className="profile-pet-row__name">
                <div className="profile-pet-card__avatar" aria-hidden="true">{getPetInitial(pet)}</div>
                <div>
                  <strong>{pet.tenThuCung}</strong>
                  {pet.ghiChu ? <p>{pet.ghiChu}</p> : null}
                </div>
              </div>
              <span>{pet.loaiThuCung} - {pet.giong}</span>
              <span>{pet.gioiTinh || 'Chưa cập nhật'}</span>
              <span>{pet.ngaySinh || 'Chưa cập nhật'}</span>
              <span>{pet.canNang ? `${pet.canNang} kg` : 'Chưa cập nhật'}</span>
              <div className="profile-pet-row__actions">
                <button className="ghost-button" onClick={() => beginEditPet(pet)} type="button">Sửa</button>
                <button className="profile-delete-button" onClick={() => void handleDeletePet(pet)} type="button">Xóa</button>
              </div>
            </article>
          ))}

          {pets.length === 0 ? <p className="empty-state">Chưa có thú cưng nào. Hãy tạo hồ sơ đầu tiên ở biểu mẫu bên dưới.</p> : null}
        </div>

        <section className="profile-pet-editor">
          <div className="section-head">
            <div>
              <p className="eyebrow">{editingPetId ? 'Chỉnh sửa thú cưng' : 'Thêm thành viên'}</p>
              <h2>{editingPetId ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ mới'}</h2>
            </div>
          </div>
          <form className="form-grid" onSubmit={handlePetSubmit}>
            <label>
              Tên thú cưng
              <input required value={petForm.tenThuCung} onChange={(event) => setPetForm((current) => ({ ...current, tenThuCung: event.target.value }))} />
            </label>
            <label>
              Loài
              <select value={petForm.loaiThuCung} onChange={(event) => setPetForm((current) => ({ ...current, loaiThuCung: event.target.value }))}>
                <option value="Chó">Chó</option>
                <option value="Mèo">Mèo</option>
                <option value="Hamster">Hamster</option>
              </select>
            </label>
            <label>
              Giống
              <input required value={petForm.giong} onChange={(event) => setPetForm((current) => ({ ...current, giong: event.target.value }))} />
            </label>
            <label>
              Giới tính
              <select value={petForm.gioiTinh ?? ''} onChange={(event) => setPetForm((current) => ({ ...current, gioiTinh: event.target.value }))}>
                <option value="Đực">Đực</option>
                <option value="Cái">Cái</option>
              </select>
            </label>
            <label>
              Ngày sinh
              <input type="date" value={petForm.ngaySinh ?? ''} onChange={(event) => setPetForm((current) => ({ ...current, ngaySinh: event.target.value }))} />
            </label>
            <label>
              Cân nặng (kg)
              <input min="0" step="0.1" type="number" value={petForm.canNang ?? ''} onChange={(event) => setPetForm((current) => ({ ...current, canNang: event.target.value === '' ? null : Number(event.target.value) }))} />
            </label>
            <label className="full-span">
              Ghi chú chăm sóc
              <textarea placeholder="Dị ứng, thói quen hoặc lưu ý khi chăm sóc..." rows={3} value={petForm.ghiChu ?? ''} onChange={(event) => setPetForm((current) => ({ ...current, ghiChu: event.target.value }))} />
            </label>
            <div className="profile-pet-editor__actions full-span">
              <button className="primary-button" disabled={submittingPet} type="submit">
                {submittingPet ? 'Đang lưu...' : editingPetId ? 'Cập nhật thú cưng' : 'Thêm thú cưng'}
              </button>
              {editingPetId ? <button className="ghost-button" onClick={cancelEditPet} type="button">Hủy sửa</button> : null}
            </div>
          </form>
          {petMessage ? <p className="feedback-line">{petMessage}</p> : null}
        </section>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './views/components/Header';
import { AdminPage } from './views/pages/AdminPage';
import { AdminSystemPage } from './views/pages/AdminSystemPage';
import { AppointmentsPage } from './views/pages/AppointmentsPage';
import { AuthPage } from './views/pages/AuthPage';
import { AuthRecoveryPage } from './views/pages/AuthRecoveryPage';
import { BillingPage } from './views/pages/BillingPage';
import { BookingPage } from './views/pages/BookingPage';
import { CustomerRewardsPage } from './views/pages/CustomerRewardsPage';
import { GoogleCallbackPage } from './views/pages/GoogleCallbackPage';
import { HomePage } from './views/pages/HomePage';
import { OperationsPage } from './views/pages/OperationsPage';
import { ProfilePage } from './views/pages/ProfilePage';
import { ReviewsPage } from './views/pages/ReviewsPage';
import { ServicesPage } from './views/pages/ServicesPage';
import { StaffPage } from './views/pages/StaffPage';
import { StaffWorkPage } from './views/pages/StaffWorkPage';
import { MedicalRecordsPage } from './views/pages/MedicalRecordsPage';
import { NotificationsPage } from './views/pages/NotificationsPage';
import { getCurrentUser } from './controllers/authApi';
import { clearSession, getStoredSession } from './controllers/authStorage';
import { getBookings } from './controllers/bookingApi';
import { getPets } from './controllers/petApi';
import { getServices } from './controllers/serviceApi';
import { connectRealtime, type RealtimeChange, type RealtimeTopic } from './controllers/realtime';
import type { AuthResponseDto } from './models/auth';
import type { LichHenDto } from './models/booking';
import type { ThuCungDto } from './models/pet';
import type { DichVuDto } from './models/service';

export default function App() {
  const location = useLocation();
  const [session, setSession] = useState<AuthResponseDto | null>(getStoredSession());
  const [services, setServices] = useState<DichVuDto[]>([]);
  const [pets, setPets] = useState<ThuCungDto[]>([]);
  const [bookings, setBookings] = useState<LichHenDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    void refreshServices().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) {
      setPets([]);
      setBookings([]);
      return;
    }

    void refreshPrivateData(session.user.maNguoiDung);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const disconnect = connectRealtime(session, (change) => {
      void handleRealtimeChange(change, session);
    });
    return () => { void disconnect(); };
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session) {
      return;
    }

    void getCurrentUser()
      .then((user) => {
        if (JSON.stringify(user) !== JSON.stringify(session.user)) {
          setSession({ ...session, user });
        }
      })
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, [session]);

  async function refreshServices(): Promise<void> {
    setServices(await getServices());
  }

  async function refreshPrivateData(maNguoiDung: string): Promise<void> {
    if (!maNguoiDung) {
      setPets([]);
      setBookings([]);
      return;
    }

    const [petData, bookingData] = await Promise.all([getPets(maNguoiDung), getBookings(maNguoiDung)]);
    setPets(petData);
    setBookings(bookingData);
  }

  async function refreshSessionUser(): Promise<void> {
    const user = await getCurrentUser();
    setSession((latestSession) => latestSession
      ? { ...latestSession, user }
      : null);
  }

  async function handleRealtimeChange(change: RealtimeChange, currentSession: AuthResponseDto): Promise<void> {
    const refreshTasks: Promise<void>[] = [];

    if (change.topic === 'services') {
      refreshTasks.push(refreshServices());
    }

    if (change.topic === 'bookings' || change.topic === 'pets') {
      refreshTasks.push(refreshPrivateData(currentSession.user.maNguoiDung));
    }

    if (change.topic === 'profile') {
      refreshTasks.push(refreshSessionUser());
    }

    if (isTopicRelevantToRoute(change.topic, pathnameRef.current)) {
      setRealtimeVersion((current) => current + 1);
    }

    await Promise.all(refreshTasks);
  }

  function handleLogout(): void {
    clearSession();
    setSession(null);
  }

  if (loading) {
    return <div className="app-shell"><p className="loading-screen">Đang tải dữ liệu...</p></div>;
  }

  const roleClass = session ? `role-${session.user.vaiTro.toLowerCase()}` : 'role-public';
  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <div className={`app-shell ${roleClass}${isAuthPage ? ' auth-route' : ''}`}>
      {isAuthPage ? null : <Header onLogout={handleLogout} session={session} />}

      <main className={isAuthPage ? 'auth-main-content' : 'main-content'}>
        <Routes key={realtimeVersion}>
          <Route path="/" element={<HomePage bookings={bookings} pets={pets} services={services} session={session} />} />
          <Route path="/services" element={<ServicesPage services={services} />} />
          <Route path="/auth" element={<AuthPage onAuthenticated={setSession} />} />
          <Route path="/auth/forgot-password" element={<AuthRecoveryPage mode="forgot-password" />} />
          <Route path="/auth/reset-password" element={<AuthRecoveryPage mode="reset-password" />} />
          <Route path="/auth/verify-email" element={<AuthRecoveryPage mode="verify-email" />} />
          <Route path="/auth/google-callback" element={<GoogleCallbackPage onAuthenticated={setSession} />} />
          <Route path="/profile" element={<ProfilePage onPetsChanged={() => refreshPrivateData(session?.user.maNguoiDung ?? '')} onSessionChanged={setSession} pets={pets} session={session} />} />
          <Route path="/reviews" element={<ReviewsPage bookings={bookings} session={session} />} />
          <Route path="/billing" element={<BillingPage session={session} />} />
          <Route path="/advanced" element={<Navigate replace to="/" />} />
          <Route path="/customer/rewards" element={<CustomerRewardsPage bookings={bookings} session={session} />} />
          <Route path="/admin/system" element={<AdminSystemPage session={session} />} />
          <Route path="/staff/work" element={<StaffWorkPage session={session} />} />
          <Route path="/operations" element={<OperationsPage session={session} />} />
          <Route path="/medical-records" element={<MedicalRecordsPage bookings={bookings} session={session} />} />
          <Route path="/notifications" element={<NotificationsPage session={session} />} />
          <Route path="/pets" element={<Navigate replace to="/profile" />} />
          <Route
            path="/booking"
            element={
              <BookingPage
                onBookingCreated={() => refreshPrivateData(session?.user.maNguoiDung ?? '')}
                pets={pets}
                services={services}
                session={session}
              />
            }
          />
          <Route
            path="/appointments"
            element={
              <AppointmentsPage
                bookings={bookings}
                onBookingsChanged={() => refreshPrivateData(session?.user.maNguoiDung ?? '')}
                pets={pets}
                services={services}
              />
            }
          />
          <Route path="/admin" element={<AdminPage onServicesChanged={refreshServices} services={services} session={session} />} />
          <Route path="/staff" element={<StaffPage session={session} />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

const topicRoutes: Record<RealtimeTopic, string[]> = {
  admin: ['/admin', '/admin/system'],
  billing: ['/billing', '/admin', '/operations'],
  bookings: ['/', '/booking', '/appointments', '/admin', '/staff', '/staff/work', '/operations', '/medical-records'],
  clinical: ['/medical-records', '/staff/work', '/profile'],
  notifications: ['/notifications'],
  pets: ['/', '/profile', '/booking', '/appointments', '/staff/work', '/medical-records'],
  profile: ['/profile', '/admin'],
  promotions: ['/', '/customer/rewards', '/admin/system'],
  reminders: ['/operations', '/staff/work', '/admin/system'],
  reviews: ['/reviews', '/admin/system'],
  services: ['/', '/services', '/booking', '/admin'],
  shifts: ['/staff', '/admin', '/operations'],
  system: ['/admin/system']
};

function isTopicRelevantToRoute(topic: RealtimeTopic, pathname: string): boolean {
  return topicRoutes[topic].some((route) => route === '/' ? pathname === '/' : pathname.startsWith(route));
}

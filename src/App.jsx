import { Suspense, lazy, useEffect, useState } from 'react';
import styled from 'styled-components';
import AuthLayout from './layout/AuthLayout.jsx';
import { MainLayout } from './layout/MainLayout.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';

// Pages are code-split so the initial bundle only carries the landing/auth flow.
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const CreateListingPage = named(() => import('./pages/CreateListingPage.jsx'), 'CreateListingPage');
const HomePage = named(() => import('./pages/HomePage.jsx'), 'HomePage');
const LandlordHomePage = named(() => import('./pages/LandlordHomePage.jsx'), 'LandlordHomePage');
const LandlordProfileSettings = named(() => import('./pages/LandlordProfileSettings.jsx'), 'LandlordProfileSettings');
const MessagesPage = named(() => import('./pages/MessagesPage.jsx'), 'MessagesPage');
const NotificationsPage = named(() => import('./pages/NotificationsPage.jsx'), 'NotificationsPage');
const BookingsPage = named(() => import('./pages/BookingsPage.jsx'), 'BookingsPage');
const ProfileSettings = named(() => import('./pages/ProfileSettings.jsx'), 'ProfileSettings');
const NeighborhoodsPage = named(() => import('./pages/NeighborhoodsPage.jsx'), 'NeighborhoodsPage');
const RoomDetails = named(() => import('./pages/RoomDetails.jsx'), 'RoomDetails');
const RoomsPage = named(() => import('./pages/RoomsPage.jsx'), 'RoomsPage');
const SavedRoomsPage = named(() => import('./pages/SavedRoomsPage.jsx'), 'SavedRoomsPage');
const SavedSearchesPage = named(() => import('./pages/SavedSearchesPage.jsx'), 'SavedSearchesPage');
const TenantDashboard = named(() => import('./pages/TenantDashboard.jsx'), 'TenantDashboard');
const AdminPage = named(() => import('./pages/AdminPage.jsx'), 'AdminPage');
const ComparePage = named(() => import('./pages/ComparePage.jsx'), 'ComparePage');
const AnalyticsPage = named(() => import('./pages/AnalyticsPage.jsx'), 'AnalyticsPage');
const InfoPage = named(() => import('./pages/InfoPage.jsx'), 'InfoPage');

// Where each role lands after signing in.
function landingPageFor(role) {
  if (role === 'landlord') return 'landlordHome';
  if (role === 'admin') return 'admin';
  return 'home';
}

const PUBLIC_PAGES = new Set(['landing', 'login', 'register']);
const LANDLORD_ONLY_PAGES = new Set(['createListing', 'editListing', 'analytics']);
const ADMIN_ONLY_PAGES = new Set(['admin']);

export default function App() {
  const { user, isLoading, logout } = useAuth();
  const [activePage, setActivePage] = useState('landing');
  const [pageParams, setPageParams] = useState({});
  const [pageHistory, setPageHistory] = useState([]);

  const navigate = (page, params = {}) => {
    if (page === activePage) {
      setPageParams(params);
      return;
    }
    setPageHistory((history) => [...history, { page: activePage, params: pageParams }]);
    setActivePage(page);
    setPageParams(params);
  };

  const goBack = () => {
    setPageHistory((history) => {
      const previous = history.at(-1) || { page: 'landing', params: {} };
      setActivePage(previous.page);
      setPageParams(previous.params);
      return history.slice(0, -1);
    });
  };

  const handleLogout = async () => {
    await logout();
    setPageHistory([]);
    setActivePage('landing');
    setPageParams({});
  };

  useEffect(() => {
    if (isLoading) return;
    if (user && activePage === 'landing') {
      setActivePage(landingPageFor(user.role));
      return;
    }
    if (!user && !PUBLIC_PAGES.has(activePage)) {
      setActivePage('landing');
      return;
    }
    if (user && LANDLORD_ONLY_PAGES.has(activePage) && user.role !== 'landlord') {
      setActivePage(user.role === 'landlord' ? 'landlordHome' : 'home');
      return;
    }
    if (user && ADMIN_ONLY_PAGES.has(activePage) && user.role !== 'admin') {
      setActivePage(landingPageFor(user.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, activePage]);

  if (isLoading) {
    return <Splash>Loading Basai Finder...</Splash>;
  }

  // Each page gets its own boundary, keyed by page so navigating clears a previous error.
  const guard = (node) => (
    <ErrorBoundary key={activePage} onReset={() => navigate('landing')}>
      <Suspense fallback={<Splash>Loading...</Splash>}>{node}</Suspense>
    </ErrorBoundary>
  );

  if (activePage === 'landing' || !user) {
    if (activePage === 'login') {
      return <LoginPage onNavigate={navigate} onBack={goBack} />;
    }
    if (activePage === 'register') {
      return <RegisterPage onNavigate={navigate} onBack={goBack} />;
    }
    if (activePage === 'info') {
      return guard(<InfoPage onNavigate={navigate} topic={pageParams.topic} />);
    }
    return <AuthLayout onNavigate={navigate} />;
  }

  if (activePage === 'home') {
    return guard(<HomePage onNavigate={navigate} onBack={goBack} />);
  }

  // Saved searches keeps its own standalone header/footer layout.
  if (activePage === 'savedSearches') {
    return guard(<SavedSearchesPage onNavigate={navigate} onBack={goBack} />);
  }

  const page = {
    dashboard: <TenantDashboard onNavigate={navigate} />,
    landlordHome: <LandlordHomePage onNavigate={navigate} />,
    neighborhoods: <NeighborhoodsPage onNavigate={navigate} />,
    rooms: <RoomsPage onNavigate={navigate} filters={pageParams} />,
    details: <RoomDetails onNavigate={navigate} listingId={pageParams.id} />,
    createListing: <CreateListingPage onNavigate={navigate} />,
    editListing: <CreateListingPage onNavigate={navigate} listingId={pageParams.id} />,
    messages: <MessagesPage conversationId={pageParams.conversationId} />,
    notifications: <NotificationsPage onNavigate={navigate} />,
    bookings: <BookingsPage onNavigate={navigate} />,
    savedRooms: <SavedRoomsPage onNavigate={navigate} />,
    compare: <ComparePage onNavigate={navigate} />,
    analytics: <AnalyticsPage onNavigate={navigate} />,
    admin: <AdminPage onNavigate={navigate} />,
    info: <InfoPage onNavigate={navigate} topic={pageParams.topic} />,
    profile:
      user.role === 'landlord' ? (
        <LandlordProfileSettings onNavigate={navigate} />
      ) : (
        <ProfileSettings />
      ),
  }[activePage];

  return (
    <MainLayout
      activePage={activePage}
      setActivePage={navigate}
      userRole={user.role}
      onBack={goBack}
      onLogout={handleLogout}
    >
      {guard(page)}
    </MainLayout>
  );
}

const Splash = styled.div`
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #f7f9ff;
  color: #1a4f9d;
  font-weight: 900;
`;

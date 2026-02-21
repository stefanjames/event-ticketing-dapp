import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './components/theme/ThemeContext';
import { WalletProvider } from './components/wallet/WalletContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventPage } from './pages/EventPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#111113' : '#ffffff',
          color: theme === 'dark' ? '#fafafa' : '#111113',
          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: theme === 'dark' ? '#111113' : '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: theme === 'dark' ? '#111113' : '#ffffff' },
        },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventPage />} />
            <Route path="/create" element={<CreateEventPage />} />
            <Route path="/my-tickets" element={<MyTicketsPage />} />
            <Route path="/dashboard" element={<OrganizerDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <AppToaster />
    </WalletProvider>
    </ThemeProvider>
  );
}

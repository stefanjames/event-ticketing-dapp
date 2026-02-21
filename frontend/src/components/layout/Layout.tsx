import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="relative z-0 flex min-h-screen flex-col bg-[#f0f0f3] text-gray-900 dark:bg-[#09090b] dark:text-white">
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

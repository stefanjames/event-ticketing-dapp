import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, Menu, X, Sun, Moon } from 'lucide-react';
import { ConnectButton } from '../wallet/ConnectButton';
import { useWalletContext } from '../wallet/WalletContext';
import { useTheme } from '../theme/ThemeContext';

const NAV_LINKS = [
  { label: 'Events', path: '/events' },
  { label: 'Create', path: '/create' },
  { label: 'My Tickets', path: '/my-tickets' },
  { label: 'Dashboard', path: '/dashboard' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { state } = useWalletContext();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? 'border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-white/6 dark:bg-[#09090b]/90 dark:shadow-none'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
            <Ticket className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">ChainTix</span>
        </Link>

        {state === 'connected' && (
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  location.pathname === path
                    ? 'bg-gray-100 text-gray-900 dark:bg-white/8 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <ConnectButton />
          {state === 'connected' && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {mobileOpen && state === 'connected' && (
        <nav className="border-t border-gray-200 bg-white/95 px-6 pb-4 pt-2 backdrop-blur-xl dark:border-white/6 dark:bg-[#09090b]/95 md:hidden">
          {NAV_LINKS.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                location.pathname === path
                  ? 'bg-gray-100 text-gray-900 dark:bg-white/8 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

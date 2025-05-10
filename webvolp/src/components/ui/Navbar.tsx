import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiPhone, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuthStore } from '../../app/store/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/call', label: 'Panggilan' },
    { path: '/history', label: 'Riwayat' },
    { path: '/about', label: 'Tentang' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/') return true;
    return pathname === path;
  };

  return (
    <header className="bg-white border-b border-secondary-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="flex-shrink-0 flex items-center text-primary-600 font-bold text-lg"
            >
              <FiPhone className="mr-2" />
              <span>VoIP App</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center">
              <nav className="flex space-x-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path}
                    href={link.path}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      isActive(link.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="flex items-center ml-4 space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      <FiUser />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                      {user.phoneNumber}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-2 text-secondary-500 hover:text-red-500 rounded-full hover:bg-secondary-100"
                    aria-label="Logout"
                  >
                    <FiLogOut />
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && user && (
        <div className="md:hidden bg-white border-b border-secondary-200 shadow-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                href={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="mt-4 pt-4 border-t border-secondary-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                  <FiUser />
                </div>
                <span className="ml-2 text-sm font-medium text-secondary-700">
                  {user.phoneNumber}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-secondary-500 hover:text-red-500 rounded-full hover:bg-secondary-100"
                aria-label="Logout"
              >
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
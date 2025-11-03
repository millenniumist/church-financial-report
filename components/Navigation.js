'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sync activeTab with pathname when navigation completes
  useEffect(() => {
    setActiveTab(pathname);
    setIsMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'หน้าแรก', href: '/' },
    { name: 'เกี่ยวกับเรา', href: '/about' },
    { name: 'การนมัสการ', href: '/worship' },
    { name: 'พันธกิจ', href: '/missions' },
    { name: 'กิจกรรม', href: '/ministries' },
    { name: 'การเงิน', href: '/financial' },
    // { name: 'โครงการ', href: '/projects' }, // Commented out until real data available
    { name: 'ติดต่อเรา', href: '/contact' },
  ];

  return (
    <nav className="backdrop-blur-xl bg-white/30 border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-blue-100/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Church Logo/Name */}
        <div className="py-6">
          <div className="flex flex-col items-center space-y-2">
            <Link href="/" className="text-center group">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-300 group-hover:scale-105">
                คริสตจักรชลบุรี ภาค7
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 opacity-80">
                Chonburi Presbyterian Church - Region 7
              </p>
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-primary/10 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              <span>{isMenuOpen ? 'ปิดเมนู' : 'เมนู'}</span>
              <span className="relative h-3 w-4">
                <span
                  className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-current transition ${
                    isMenuOpen ? 'translate-y-1.5 rotate-45' : ''
                  }`}
                />
                <span
                  className={`absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-current transition ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute inset-x-0 top-3 h-0.5 rounded-full bg-current transition ${
                    isMenuOpen ? '-translate-y-1.5 -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex justify-center items-center overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setActiveTab(item.href)}
                  className={`
                    relative px-4 sm:px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-full
                    ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-200/50'
                        : 'text-foreground/70 hover:text-foreground hover:bg-white/40 backdrop-blur-sm'
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-nav-menu"
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[520px] opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="grid gap-2 rounded-2xl border border-primary/20 bg-white/80 p-4 shadow-sm">
            {navItems.map((item) => {
              const isActive = activeTab === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setActiveTab(item.href)}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'text-slate-700 bg-white hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

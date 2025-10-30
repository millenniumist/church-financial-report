'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'หน้าแรก', href: '/' },
    { name: 'เกี่ยวกับเรา', href: '/about' },
    { name: 'การนมัสการ', href: '/worship' },
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
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center items-center overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
      </div>
    </nav>
  );
}

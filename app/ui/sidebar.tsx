'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

const staffLinks = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/books', label: 'Sách' },
  { href: '/readers', label: 'Độc giả' },
  { href: '/borrow', label: 'Mượn / Trả' },
  { href: '/users', label: 'Tài khoản' },
  { href: '/reservations', label: 'Lịch đặt' },
  { href: '/roles', label: 'Vai trò & quyền' },
  { href: '/fines', label: 'Khoản phạt' },
  { href: '/audit', label: 'Nhật ký' },
];

export function Sidebar() {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const links = user?.role === 'student'
    ? [{ href: '/reservations', label: 'Đặt lịch mượn' }]
    : staffLinks.filter((link) =>
        (link.href !== '/users' || user?.role === 'admin') &&
        (link.href !== '/roles' || user?.role === 'admin') &&
        (link.href !== '/fines' || user?.role !== 'student') &&
        (link.href !== '/audit' || user?.role === 'admin'),
      );

  if (!isAuthenticated) return null;

  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between bg-ink px-5 py-8 text-white">
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight text-white">Thư viện</h1>
        <nav className="mt-10 flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-brass text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        className="rounded-md px-3 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        Đăng xuất
      </button>
    </aside>
  );
}

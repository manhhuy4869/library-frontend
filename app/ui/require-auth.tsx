'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

// Bọc quanh mọi page cần đăng nhập - check CLIENT-SIDE (không dùng Next.js
// middleware vì token nằm ở localStorage, middleware chạy trên edge/server
// không đọc được localStorage). Đủ dùng cho công cụ quản trị nội bộ.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isStudentOnStaffPage = user?.role === 'student' && pathname !== '/reservations';

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
    else if (!loading && isAuthenticated && isStudentOnStaffPage) router.replace('/reservations');
  }, [loading, isAuthenticated, isStudentOnStaffPage, router]);

  if (loading || !isAuthenticated || isStudentOnStaffPage) {
    return <div className="text-sm text-ink-soft">Đang tải...</div>;
  }
  return <>{children}</>;
}

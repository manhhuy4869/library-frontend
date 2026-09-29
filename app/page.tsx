'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './lib/auth-context';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [loading, isAuthenticated, router]);

  return <div className="text-sm text-ink-soft">Đang tải...</div>;
}

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './api';

interface SessionUser {
  username: string;
  role: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: SessionUser | null;
  loading: boolean; // true trong lúc đọc localStorage lần đầu (tránh nháy redirect sai)
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStudent: (dto: {
    username: string;
    password: string;
    fullName: string;
    studentCode: string;
    className?: string;
    phone?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Chỉ để HIỂN THỊ UI (tên user, ẩn nút xóa chính mình) - không dùng để authorize
// gì cả, việc đó BE tự lo qua JwtAuthGuard. Không verify chữ ký vì FE không có
// secret, chỉ đọc phần payload (base64) - an toàn vì chỉ đọc, không tin tưởng để quyết định quyền.
function decodeToken(token: string): SessionUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const authed = authApi.isAuthenticated();
    setIsAuthenticated(authed);
    if (authed) {
      const token = localStorage.getItem('accessToken');
      if (token) setUser(decodeToken(token));
    }
    setLoading(false);
  }, []);

  async function login(username: string, password: string) {
    const data = await authApi.login(username, password);
    setIsAuthenticated(true);
    const sessionUser = decodeToken(data.accessToken);
    setUser(sessionUser);
    router.push(sessionUser?.role === 'student' ? '/reservations' : '/dashboard');
  }

  async function registerStudent(dto: Parameters<typeof authApi.registerStudent>[0]) {
    await authApi.registerStudent(dto);
  }

  async function logout() {
    await authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, registerStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
}

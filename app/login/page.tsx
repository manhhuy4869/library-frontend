'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { ApiError } from '../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
        <h1 className="text-2xl">Thư viện</h1>
        <p className="mt-1 text-sm text-ink-soft">Đăng nhập để quản lý sách, độc giả và mượn/trả.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input label="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          <Input
            type="password"
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-soft">
          Sinh viên mới? <Link className="font-medium text-ink underline" href="/register">Tạo tài khoản</Link>
        </p>
      </div>
    </div>
  );
}

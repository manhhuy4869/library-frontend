'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { ApiError } from '../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function RegisterPage() {
  const { registerStudent } = useAuth();
  const [values, setValues] = useState({
    fullName: '',
    username: '',
    password: '',
    studentCode: '',
    className: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerStudent(values);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tạo tài khoản');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-ink px-4 py-8">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-xl">
        <h1 className="text-2xl">Tài khoản sinh viên</h1>
        <p className="mt-1 text-sm text-ink-soft">Thông tin tài khoản dùng để đặt lịch mượn sách.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input label="Họ và tên" value={values.fullName} onChange={(e) => set('fullName', e.target.value)} required />
          <Input label="Mã sinh viên" value={values.studentCode} onChange={(e) => set('studentCode', e.target.value)} required />
          <Input label="Tên đăng nhập" value={values.username} onChange={(e) => set('username', e.target.value)} required />
          <Input label="Mật khẩu" type="password" minLength={6} value={values.password} onChange={(e) => set('password', e.target.value)} required />
          <Input label="Lớp" value={values.className} onChange={(e) => set('className', e.target.value)} />
          <Input label="Số điện thoại" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
          {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
          <div className="flex items-center justify-between sm:col-span-2">
            <Link href="/login" className="text-sm text-ink-soft underline">Quay lại đăng nhập</Link>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
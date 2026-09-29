'use client';

import { useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';

interface ChangePasswordFormProps {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
}

export function ChangePasswordForm({ onSubmit }: ChangePasswordFormProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await onSubmit(oldPassword, newPassword);
      setMessage('Đổi mật khẩu thành công.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card flex max-w-sm flex-col gap-4">
      <h2>Đổi mật khẩu của tôi</h2>
      <Input
        type="password"
        placeholder="Mật khẩu hiện tại"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Mật khẩu mới"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={6}
      />
      {error && <p className="field-error">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}
      <Button variant="primary" type="submit">
        Đổi mật khẩu
      </Button>
    </form>
  );
}

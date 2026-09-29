'use client';

import { useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { Select } from '../select';
import type { AccessRole, User, UserRole } from '../../lib/types';

export interface UserFormValues {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

const emptyValues: UserFormValues = { username: '', password: '', fullName: '', role: 'librarian' };

interface UserFormProps {
  editing: User | null;
  fieldErrors: Record<string, string[]>;
  roles: AccessRole[];
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

export function UserForm({ editing, fieldErrors, roles, onSubmit, onCancel }: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>(
    editing
      ? { username: editing.username, password: '', fullName: editing.fullName, role: editing.role }
      : emptyValues,
  );

  function set<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="flex flex-col gap-4"
    >
      <Input
        placeholder="Tên đăng nhập"
        value={values.username}
        onChange={(e) => set('username', e.target.value)}
        error={fieldErrors.username?.join(', ')}
        disabled={!!editing} // không cho đổi username sau khi tạo
      />
      {!editing && (
        <Input
          type="password"
          placeholder="Mật khẩu"
          value={values.password}
          onChange={(e) => set('password', e.target.value)}
          error={fieldErrors.password?.join(', ')}
        />
      )}
      <Input
        placeholder="Họ tên"
        value={values.fullName}
        onChange={(e) => set('fullName', e.target.value)}
        error={fieldErrors.fullName?.join(', ')}
      />
      <Select label="Vai trò" value={values.role} onChange={(e) => set('role', e.target.value as UserRole)}>
        {roles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
      </Select>
      <div className="flex gap-2">
        <Button variant="primary" type="submit">
          Lưu
        </Button>
        <Button type="button" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </form>
  );
}

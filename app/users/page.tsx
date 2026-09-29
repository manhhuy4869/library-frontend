'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../ui/require-auth';
import { Button } from '../ui/button';
import { Pagination } from '../ui/pagination';
import { ErrorText } from '../ui/notice';
import { UserTable } from '../ui/users/user-table';
import { UserForm, UserFormValues } from '../ui/users/user-form';
import { ChangePasswordForm } from '../ui/users/change-password-form';
import { Modal } from '../ui/modal';
import { usersApi, rolesApi, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { AccessRole, User } from '../lib/types';

const PAGE_SIZE = 10;

function UsersPageContent() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [res, availableRoles] = await Promise.all([
        usersApi.list({ page, pageSize: PAGE_SIZE }),
        rolesApi.list(),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setRoles(availableRoles);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleSubmit(values: UserFormValues) {
    setFieldErrors({});
    try {
      if (editing) await usersApi.update(editing.id, { fullName: values.fullName, role: values.role });
      else await usersApi.create(values);
      setShowForm(false);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      else setError(err instanceof ApiError ? err.message : 'Lỗi lưu tài khoản');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa tài khoản này?')) return;
    try {
      await usersApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xóa được tài khoản');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1>Tài khoản</h1>
          <p className="mt-1 text-sm text-ink-soft">{total} tài khoản</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null);
            setFieldErrors({});
            setShowForm(true);
          }}
        >
          + Thêm tài khoản
        </Button>
      </div>

      <ErrorText>{error}</ErrorText>

      {showForm && <Modal title={editing ? 'Sửa tài khoản' : 'Thêm tài khoản'} onClose={() => setShowForm(false)}>
        {error && <ErrorText>{error}</ErrorText>}
        <UserForm editing={editing} roles={roles} fieldErrors={fieldErrors} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      </Modal>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <UserTable
          items={items}
          loading={loading}
          currentUsername={currentUser?.username}
          onEdit={(user) => {
            setEditing(user);
            setFieldErrors({});
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} onChange={setPage} />

      <div className="mt-10">
        <ChangePasswordForm onSubmit={(oldP, newP) => usersApi.changePassword(oldP, newP)} />
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <RequireAuth>
      <UsersPageContent />
    </RequireAuth>
  );
}
